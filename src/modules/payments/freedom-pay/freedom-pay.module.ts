import { Global, Module } from '@nestjs/common';
import { FreedomPayService } from './freedom-pay.service';
import { FreedomPayResolver } from './freedom-pay.resolver';

@Global()
@Module({
  providers: [FreedomPayResolver, FreedomPayService],
  exports: [FreedomPayService],
})
export class FreedomPayModule {}
