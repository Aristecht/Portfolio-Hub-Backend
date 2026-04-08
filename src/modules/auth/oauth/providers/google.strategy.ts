import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

import { getGoogleConfig } from '../../../../core/config/google.config';
import { Injectable } from '@nestjs/common';
import { OAuthProfile } from '../../../../shared/types/oauth.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super(getGoogleConfig(configService));
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const { id, displayName, emails, photos, provider } = profile;

    const oauthProfile: OAuthProfile = {
      provider,
      providerId: id,
      email: emails?.[0]?.value ?? '',
      name: displayName,
      avatar: photos?.[0]?.value,
    };
    done(null, oauthProfile);
  }
}
