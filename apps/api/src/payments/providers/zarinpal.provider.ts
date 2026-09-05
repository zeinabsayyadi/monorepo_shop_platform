import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentProvider,
  PaymentRequestResult,
  PaymentVerifyResult,
} from '../payment-provider.interface';

@Injectable()
export class ZarinpalProvider implements PaymentProvider {
  private readonly merchantId: string;
  private readonly baseUrl: string;
  private readonly startPayUrl: string;

  constructor(config: ConfigService) {
    this.merchantId = config.getOrThrow<string>('ZARINPAL_MERCHANT_ID');
    const sandbox = config.get<string>('ZARINPAL_SANDBOX') === 'true';
    this.baseUrl = sandbox
      ? 'https://sandbox.zarinpal.com'
      : 'https://api.zarinpal.com';
    this.startPayUrl = sandbox
      ? 'https://sandbox.zarinpal.com/pg/StartPay'
      : 'https://www.zarinpal.com/pg/StartPay';
  }

  async request(
    amount: number,
    description: string,
    callbackUrl: string,
  ): Promise<PaymentRequestResult> {
    const res = await fetch(`${this.baseUrl}/pg/v4/payment/request.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: this.merchantId,
        amount,
        description,
        callback_url: callbackUrl,
      }),
    });
    const data = await res.json();

    if (data.data?.code !== 100) {
      throw new Error(
        `Zarinpal request failed: ${JSON.stringify(data.errors ?? data)}`,
      );
    }

    return {
      authority: data.data.authority,
      redirectUrl: `${this.startPayUrl}/${data.data.authority}`,
    };
  }

  async verify(
    authority: string,
    amount: number,
  ): Promise<PaymentVerifyResult> {
    const res = await fetch(`${this.baseUrl}/pg/v4/payment/verify.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: this.merchantId,
        amount,
        authority,
      }),
    });
    const data = await res.json();

    if (data?.data?.code === 100 || data?.data?.code === 101) {
      return { success: true, refId: String(data?.data.ref_id) };
    }
    return { success: false };
  }
}
