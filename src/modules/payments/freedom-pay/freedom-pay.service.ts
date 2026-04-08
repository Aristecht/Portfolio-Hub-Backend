import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';
import axios from 'axios';
import { URLSearchParams } from 'url';

interface CreatePaymentParams {
  orderId: string;
  amount: number;
  description: string;
  email?: string;
  phone?: string;
}

@Injectable()
export class FreedomPayService {
  private readonly merchantId: string;
  private readonly secretKey: string;
  private readonly apiUrl: string;
  constructor(private readonly configService: ConfigService) {
    this.merchantId = this.configService.getOrThrow<string>(
      'FREEDOM_PAY_MERCHANT_ID',
    );
    this.secretKey = this.configService.getOrThrow<string>(
      'FREEDOM_PAY_SECRET_KEY',
    );
    this.apiUrl = this.configService.getOrThrow<string>('FREEDOM_PAY_API_URL');
  }

  async createPayment(params: CreatePaymentParams) {
    const { amount, description, orderId, email, phone } = params;

    const successUrl = this.configService.get('PAYMENT_SUCCESS_URL');
    const failureUrl = this.configService.get('PAYMENT_FAILURE_URL');
    const callbackUrl = this.configService.get('FREEDOM_PAY_CALLBACK_URL');

    const paymentData = {
      pg_merchant_id: this.merchantId,
      pg_order_id: orderId,
      pg_amount: String(amount / 100),
      pg_currency: 'KZT',
      pg_description: description,
      pg_success_url: successUrl,
      pg_failure_url: failureUrl,
      pg_result_url: callbackUrl,
      pg_request_method: 'POST',
      pg_user_contact_email: email || '',
      pg_user_phone: phone || '',
    };

    const signature = this.generateSignature(paymentData);
    paymentData['pg_sig'] = signature;

    try {
      const response = await axios.post(
        `${this.apiUrl}/init_payment.php`,
        new URLSearchParams(paymentData).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const redirectUrl = this.extractRedirectUrl(response.data);
      const transactionId = this.extractTransactionId(response.data);

      console.log(`Freedom Pay payment created: ${orderId}`);

      return {
        paymentUrl: redirectUrl,
        transactionId,
      };
    } catch (error) {
      console.error('Failed to create Freedom Pay payment', error);
      throw error;
    }
  }

  async checkPaymentStatus(paymentId: string) {
    const requestData = {
      pg_merchant_id: this.merchantId,
      pg_payment_id: paymentId,
    };

    const signature = this.generateSignature(requestData);
    requestData['pg_sig'] = signature;

    try {
      const response = await axios.post(
        `${this.apiUrl}/get_status.php`,
        requestData,
      );

      return {
        status: this.extractStatus(response.data),
        amount: this.extractAmount(response.data),
      };
    } catch (error) {
      console.error('Failed to check payment status', error);
      throw error;
    }
  }

  async refundPayment(paymentId: string, amount: number) {
    const requestData = {
      pg_merchant_id: this.merchantId,
      pg_payment_id: paymentId,
      pg_refund_amount: String(amount / 100),
    };

    const signature = this.generateSignature(requestData);
    requestData['pg_sig'] = signature;

    try {
      const response = await axios.post(
        `${this.apiUrl}/do_refund.php`,
        new URLSearchParams(requestData).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      console.log(`Refund created for payment ${paymentId}`);

      return {
        refundId: this.extractRefundId(response.data),
        status: this.extractStatus(response.data),
      };
    } catch (error) {
      console.error('Failed to create refund', error);
      throw error;
    }
  }

  private generateSignature(params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .filter(key => key !== 'pg_sig')
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join(';');

    const signString = `${sorted};${this.secretKey}`;

    return crypto.createHash('md5').update(signString).digest('hex');
  }

  verifyCallback(data: Record<string, any>): boolean {
    const recievedSignature = data.pg_sig;
    const mySignature = this.generateSignature(data);

    return recievedSignature === mySignature;
  }

  private extractRedirectUrl(xml: string): string {
    const match = xml.match(/<pg_redirect_url>(.*?)<\/pg_redirect_url>/);
    return match ? match[1] : '';
  }

  private extractTransactionId(xml: string): string {
    const match = xml.match(/<pg_payment_id>(.*?)<\/pg_payment_id>/);
    return match ? match[1] : '';
  }

  private extractStatus(xml: string): string {
    const match = xml.match(/<pg_status>(.*?)<\/pg_status>/);
    return match ? match[1] : '';
  }

  private extractAmount(xml: string): number {
    const match = xml.match(/<pg_amount>(.*?)<\/pg_amount>/);
    return match ? parseFloat(match[1]) * 100 : 0;
  }

  private extractRefundId(xml: string): string {
    const match = xml.match(/<pg_refund_id>(.*?)<\/pg_refund_id>/);
    return match ? match[1] : '';
  }
}
