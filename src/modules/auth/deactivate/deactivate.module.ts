import { Module } from '@nestjs/common';
import { DeactivateService } from './deactivate.service';
import { DeactivateResolver } from './deactivate.resolver';
import { MailService } from '../../libs/mail/mail.service';

@Module({
  providers: [DeactivateResolver, DeactivateService, MailService],
})
export class DeactivateModule {}
