import { ConfigService } from '@nestjs/config';
import { StrategyOptions } from 'passport-google-oauth20';

export const getGoogleConfig = (
  configService: ConfigService,
): StrategyOptions => ({
  clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
  clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
  callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
  scope: ['email', 'profile'],
});
