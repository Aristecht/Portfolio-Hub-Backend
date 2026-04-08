import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class KaspiPayService {
  private readonly merchantId: string;
  private readonly secretKey: string;
  private readonly apiUrl: string;
  private readonly merchantName: string;
  constructor(private readonly configService: ConfigService) {
    this.merchantId = this.configService.getOrThrow<string>(
      'KASPI_PAY_MERCHANT_ID',
    );
    this.secretKey = this.configService.getOrThrow<string>(
      'KASPI_PAY_SECRET_KEY',
    );
    this.apiUrl = this.configService.getOrThrow<string>('KASPI_PAY_API_URL');
    this.merchantName = this.configService.getOrThrow<string>(
      'KASPI_MERCHANT_NAME',
    );
  }

  async createPayment(params: {
    orderId: string;
    amount: number;
    description: string;
    customerPhone?: string;
  }) {
    const { amount, description, orderId, customerPhone } = params;

    const paymentData = {
      merchantId: this.merchantId,
      merchantName: this.merchantName,
      orderId,
      amount: amount / 100,
      currency: 'KZT',
      customerPhone,
      description,
      callbackUrl: this.configService.get('KASPI_CALLBACK_URL'),
      timestamp: Date.now(),
    };

    const signature = this.generateSignature(paymentData);

    try {
      const response = await axios.post(
        `${this.apiUrl}/payment/create`,
        {
          ...paymentData,
          signature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-Id': this.merchantId,
          },
        },
      );

      console.log(`Kaspi payment created: ${orderId}`);

      return {
        transactionId: response.data.transactionId,
        paymentUrl: response.data.paymentUrl,
        qrCode: response.data.qrCode,
        webUrl: response.data.webUrl,
        expiresAt: new Date(response.data.expiresAt),
      };
    } catch (error) {
      console.error('Failed to create Kaspi payment', error);
      throw error;
    }
  }

  async checkPaymentStatus(transactionId: string) {
    const timestamp = new Date().toISOString();

    const requestData = {
      merchantId: this.merchantId,
      transactionId,
      timestamp,
    };

    const signature = this.generateSignature(requestData);

    try {
      const response = await axios.get(`${this.apiUrl}/payment/status`, {
        params: {
          ...requestData,
          signature,
        },
        headers: {
          'X-Merchant-Id': this.merchantId,
        },
      });

      return {
        status: response.data.status,
        amount: response.data.amount,
        paidAt: response.data.paidAt ? new Date(response.data.paidAt) : null,
      };
    } catch (error) {
      console.error('Failed to check Kaspi payment status', error);
      throw error;
    }
  }

  async cancelPayment(transactionId: string) {
    const timestamp = new Date().toISOString();

    const requestData = {
      merchantId: this.merchantId,
      transactionId,
      timestamp,
    };

    const signature = this.generateSignature(requestData);

    try {
      const response = await axios.post(
        `${this.apiUrl}/payment/cacnel`,
        {
          ...requestData,
          signature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-Id': this.merchantId,
          },
        },
      );

      return {
        success: true,
        transactionId: response.data.transactionId,
      };
    } catch (error) {
      console.error('Failed to cancel Kaspi payment', error);
      throw error;
    }
  }

  async refundPayment(transactionId: string, amount?: number) {
    const timestamp = new Date().toISOString();

    const requestData = {
      merchantId: this.merchantId,
      transactionId,
      amount,
      timestamp,
    };

    const signature = this.generateSignature(requestData);

    try {
      const response = await axios.post(
        `${this.apiUrl}/payment/refund`,
        {
          ...requestData,
          signature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-Id': this.merchantId,
          },
        },
      );

      console.log(`Kaspi refund created: ${transactionId}`);

      return {
        refundId: response.data.refundId,
        status: response.data.status,
        amount: response.data.amounts,
      };
    } catch (error) {
      console.error('Failed to create Kaspi refund', error);
      throw error;
    }
  }

  private generateSignature(data: Record<string, any>): string {
    const { signature, ...params } = data;

    const sortedKeys = Object.keys(params).sort();

    const signString = sortedKeys
      .map(key => {
        const value = params[key];
        if (value === null || value === undefined || value === '') {
          return null;
        }
        return `${key}=${value}`;
      })
      .filter(Boolean)
      .join('&');

    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(signString);
    return hmac.digest('hex');
  }

  verifyWebhookSignature(data: Record<string, any>): boolean {
    const receivedSignature = data.signature;

    if (!receivedSignature) {
      console.warn('No signature in webhook data');
      return false;
    }

    const mySignature = this.generateSignature(data);

    const isValid = receivedSignature === mySignature;

    if (!isValid) {
      console.warn('Invalid webhook signature');
    }

    return isValid;
  }
}
