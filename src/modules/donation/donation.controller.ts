import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { DonationService } from './donation.service';
import { KaspiPayService } from '../payments/kaspi-pay/kaspi-pay.service';
import { FreedomPayService } from '../payments/freedom-pay/freedom-pay.service';
import { FreedomPayWebhookDto } from './dto/freedom_callback.dto';

@Controller('webhooks')
export class DonationController {
  constructor(
    private readonly donationService: DonationService,
    private readonly kaspiPayService: KaspiPayService,
    private readonly freedomPayService: FreedomPayService,
  ) {}

  @Post('kaspi')
  @HttpCode(HttpStatus.OK)
  async handleKaspiWebhook(@Body() data: any) {
    const isValid = this.kaspiPayService.verifyWebhookSignature(data);

    if (!isValid) {
      throw new BadRequestException('Неверная подпись');
    }

    try {
      await this.donationService.handleKaspiCallback(data);

      return {
        success: true,
        message: 'Webhook processed',
      };
    } catch (error) {
      console.log('Kaspi webhook processing error', error);
      return {
        success: false,
        message: 'Processing error',
      };
    }
  }

  @Post('freedompay')
  @HttpCode(HttpStatus.OK)
  async handleFreedomWebhook(@Body() data: FreedomPayWebhookDto) {
    const isValid = this.freedomPayService.verifyCallback(data);

    if (!isValid) {
      throw new BadRequestException('Неверная подпись');
    }

    try {
      await this.donationService.handleFreedomCallback(data);

      return `
        <?xml version="1.0" encoding="utf-8"?>
        <response>
          <pg_status>ok</pg_status>
          <pg_description>Payment processed</pg_description>
        </response>`;
    } catch (error) {
      console.log('Freedom webhook processing error', error);
      return `
      <response>
        <pg_status>error</pg_status>
        <pg_description>Processing error</pg_description>
      </response>`;
    }
  }
}
