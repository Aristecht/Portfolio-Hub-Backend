import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/components';
import { verificationTemplate } from './templates/verification.template';
import type { SessionMetadata } from '../../../shared/types/session-metadata.types';
import { PasswordResetTemplate } from './templates/password-recovery.template';
import { DeactiavteTemplate } from './templates/deactivate.template';
import { AccountDeletionTemplate } from './templates/account-deletion.template';
import { verificationNewEmailTemplate } from './templates/verification-chanched-email.template';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendVerificationToken(email: string, token: string) {
    const domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN');
    const html = await render(verificationTemplate({ domain, token }));
    return this.sendMail(email, 'Portfolio-Hub: Верификация аккаунта', html);
  }
  async sendVerificationNewEmailToken(email: string, token: string) {
    const domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN');
    const html = await render(verificationNewEmailTemplate({ domain, token }));
    return this.sendMail(
      email,
      'Portfolio-Hub: Подтверждение адреса электронной почты',
      html,
    );
  }

  async sendPasswordResetToken(
    email: string,
    token: string,
    metadata: SessionMetadata,
  ) {
    const domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN');
    const html = await render(
      PasswordResetTemplate({ domain, token, metadata }),
    );
    return this.sendMail(email, 'Portfolio-Hub: Сброс пароля', html);
  }

  async sendDeactivateToken(
    email: string,
    token: string,
    metadata: SessionMetadata,
  ) {
    const html = await render(DeactiavteTemplate({ token, metadata }));
    return this.sendMail(email, 'Portfolio-Hub: Деактивация аккаунта', html);
  }

  async sendAccountDeletion(email: string) {
    const domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN');
    const html = await render(AccountDeletionTemplate({ domain }));
    return this.sendMail(email, 'Portfolio-Hub: Аккаунт удален', html);
  }

  private sendMail(email: string, subject: string, html: string) {
    const fromEmail = this.configService.getOrThrow<string>('MAIL_FROM');
    return this.mailerService.sendMail({
      from: fromEmail,
      to: email,
      subject,
      html,
    });
  }
}
