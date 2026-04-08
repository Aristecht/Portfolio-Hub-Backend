import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { OauthService } from './oauth.service';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { OAuthProfile } from '../../../shared/types/oauth.types';
import { UserAgent } from '../../../shared/decorators/user-agent.decorator';

@Controller('oauth')
export class OauthController {
  constructor(
    private readonly oauthService: OauthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
    @UserAgent() userAgent: string,
  ) {
    const profile = req.user as OAuthProfile;

    await this.oauthService.validateOauthUser(profile, req, userAgent);
    const frontendUrl = this.configService.getOrThrow<string>('ALLOWED_ORIGIN');
    res.redirect(frontendUrl);
  }
}
