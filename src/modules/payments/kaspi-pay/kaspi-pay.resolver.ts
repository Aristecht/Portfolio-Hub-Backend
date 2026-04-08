import { Resolver } from '@nestjs/graphql';
import { KaspiPayService } from './kaspi-pay.service';

@Resolver('KaspiPay')
export class KaspiPayResolver {
  constructor(private readonly kaspiPayService: KaspiPayService) {}
}
