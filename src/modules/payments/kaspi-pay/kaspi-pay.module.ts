import { Global, Module } from '@nestjs/common';
import { KaspiPayService } from './kaspi-pay.service';
import { KaspiPayResolver } from './kaspi-pay.resolver';

@Global()
@Module({
  providers: [KaspiPayResolver, KaspiPayService],
  exports: [KaspiPayService],
})
export class KaspiPayModule {}
