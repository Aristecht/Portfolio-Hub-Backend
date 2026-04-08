import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { StorageService } from '../../libs/storage/storage.service';
import { type User } from '../../../../prisma/generated/prisma/client';
import sharp from 'sharp';
import { ChangeProfileInput } from './inputs/change-profile-info.input';
import { UploadedFile } from '../../../shared/types/uploadedFile.types';
import {
  SocialLinkInput,
  SocialLinkOrderInput,
} from './inputs/social-link.input';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async changeAvatar(user: User, file: UploadedFile) {
    try {
      if (user.avatar) {
        await this.storageService.remove(user.avatar);
      }

      const fileName = `avatars/${user.username}-${Date.now()}.webp`;
      const isGif = file.mimetype === 'image/gif';

      let processedBuffer: Buffer;

      if (isGif) {
        processedBuffer = await sharp(file.buffer, { animated: true })
          .resize(512, 512, { fit: 'cover' })
          .webp()
          .toBuffer();
      } else {
        processedBuffer = await sharp(file.buffer)
          .resize(512, 512, { fit: 'cover' })
          .webp()
          .toBuffer();
      }

      await this.storageService.upload(processedBuffer, fileName, 'image/webp');

      await this.prismaService.user.update({
        where: {
          id: user.id,
        },
        data: {
          avatar: fileName,
        },
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  async removeAvatar(user: User) {
    if (!user.avatar) return;

    await this.storageService.remove(user.avatar);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        avatar: null,
      },
    });

    return true;
  }

  async changeProfileInfo(user: User, input: ChangeProfileInput) {
    const { username, displayName, bio } = input;

    const usernameExists = await this.prismaService.user.findUnique({
      where: { username },
    });

    if (usernameExists && user.username !== username) {
      throw new ConflictException('Имя пользователя уже занято');
    }

    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        username,
        displayName,
        bio,
      },
    });

    return true;
  }

  async createSocialLink(user: User, input: SocialLinkInput) {
    const { title, url } = input;

    const lastSocialLink = await this.prismaService.socialLink.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: {
        position: 'desc',
      },
    });

    const newPosition = lastSocialLink ? lastSocialLink.position + 1 : 1;

    await this.prismaService.socialLink.create({
      data: {
        title,
        url,
        position: newPosition,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    return true;
  }

  async reorderSocialLinks(user: User, list: SocialLinkOrderInput[]) {
    if (!list.length) return;

    const updatePromises = list.map(socialLink => {
      return this.prismaService.socialLink.updateMany({
        where: {
          id: socialLink.id,
          userId: user.id,
        },
        data: {
          position: socialLink.position,
        },
      });
    });

    await Promise.all(updatePromises);

    return true;
  }

  async updateSocialLink(id: string, input: SocialLinkInput) {
    const { title, url } = input;

    await this.prismaService.socialLink.update({
      where: {
        id,
      },
      data: {
        title,
        url,
      },
    });

    return true;
  }

  async removeSocialLink(id: string) {
    await this.prismaService.socialLink.delete({
      where: {
        id,
      },
    });

    return true;
  }

  async findSocialMedia(user: User) {
    const socialLinks = await this.prismaService.socialLink.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        position: 'asc',
      },
    });

    return socialLinks;
  }
}
