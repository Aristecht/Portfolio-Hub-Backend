import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateUserInput } from './inputs/create-user.input';
import { hash, verify } from 'argon2';
import { VerificationService } from '../verification/verification.service';
import { ChangeEmailInput } from './inputs/change-email.input';
import {
  TokenType,
  type User,
} from '../../../../prisma/generated/prisma/client';
import { ChangePasswordInput } from './inputs/change-password.input';
import { generateToken } from '../../../shared/utils/generate-token.util';
import { MailService } from '../../libs/mail/mail.service';
import { NewEmailInput } from './inputs/new-email.input';

@Injectable()
export class AccountService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly verificationService: VerificationService,
    private readonly mailService: MailService,
  ) {}

  async findAll() {
    return this.prismaService.user.findMany();
  }

  async me(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: {
        socialLink: true,
        albums: true,
        notifications: true,
        projectLikes: { select: { projectId: true } },
        comments: true,
        notificationsSettings: true,
      },
    });

    if (!user) return null;

    return {
      ...user,
      projectLikes: user.projectLikes.map(l => l.projectId),
    };
  }

  async create(input: CreateUserInput) {
    const { username, email, password } = input;

    const isUsernameExist = await this.prismaService.user.findUnique({
      where: { username },
    });
    if (isUsernameExist) {
      throw new ConflictException('Это имя пользователя уже занято');
    }
    const isEmailExist = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (isEmailExist) {
      throw new ConflictException('Эта почта уже занята');
    }

    const user = await this.prismaService.user.create({
      data: {
        username,
        email,
        password: await hash(password),
        displayName: username,
        notificationsSettings: {
          create: {},
        },
      },
    });

    await this.verificationService.sendVerificationToken(user);

    return user;
  }

  async changePassword(user: User, input: ChangePasswordInput) {
    const { oldPassword, newPassword } = input;

    const hasPassword = user.password && user.password.trim() !== '';

    if (hasPassword) {
      if (!oldPassword) {
        throw new BadRequestException('Старый пароль обязателен');
      }
      const isValidPassword = await verify(user.password, oldPassword);

      if (!isValidPassword) {
        throw new UnauthorizedException('Неверный старый пароль');
      }

      const isSamePassword = await verify(user.password, newPassword);

      if (isSamePassword) {
        throw new BadRequestException(
          'Новый пароль должен отличаться от старого',
        );
      }
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        password: await hash(newPassword),
      },
    });

    return true;
  }

  async changeEmail(user: User, input: ChangeEmailInput) {
    const { email } = input;

    const existingUser = await this.prismaService.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Веденная вами почта уже занята');
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        pendingNewEmail: email,
      },
    });

    const VerificationNewEmailToken = await generateToken(
      this.prismaService,
      user,
      TokenType.EMAIL_VERIFY,
    );

    await this.mailService.sendVerificationNewEmailToken(
      email,
      VerificationNewEmailToken.token,
    );

    return true;
  }

  async newEmail(user: User, input: NewEmailInput) {
    const { token } = input;

    const existingToken = await this.prismaService.token.findFirst({
      where: {
        token,
        type: TokenType.EMAIL_VERIFY,
        userId: user.id,
      },
    });

    if (!existingToken) {
      throw new BadRequestException('Неверный токен');
    }

    const currentUser = await this.prismaService.user.findFirst({
      where: { id: user.id },
    });

    const hasExpired = new Date(existingToken.expiresIn) < new Date();

    if (hasExpired) {
      throw new BadRequestException('Токен истёк');
    }

    if (!user.pendingNewEmail) {
      throw new BadRequestException('Нет почты для подтверждения');
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { email: currentUser.pendingNewEmail, pendingNewEmail: null },
    });

    await this.prismaService.token.delete({
      where: { id: existingToken.id, type: TokenType.EMAIL_VERIFY },
    });

    return true;
  }
}
