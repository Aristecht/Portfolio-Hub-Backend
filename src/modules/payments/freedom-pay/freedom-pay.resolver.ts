import { Resolver } from '@nestjs/graphql';
import { FreedomPayService } from './freedom-pay.service';

@Resolver('FreedomPay')
export class FreedomPayResolver {
  constructor(private readonly freedomPayService: FreedomPayService) {}
}
