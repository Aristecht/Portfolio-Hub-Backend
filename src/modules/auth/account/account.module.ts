import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountResolver } from './account.resolver';
import { VerificationService } from '../verification/verification.service';
import { MailService } from '../../libs/mail/mail.service';

@Module({
  providers: [
    AccountResolver,
    AccountService,
    VerificationService,
    MailService,
  ],
})
export class AccountModule {}
