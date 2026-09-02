import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsProvider } from '../sms-provider.interface';

@Injectable()
export class KavenegarSmsProvider implements SmsProvider {
  private readonly apiKey: string;
  private readonly sender?: string;

  constructor(config: ConfigService) {
    this.apiKey = config.getOrThrow<string>('KAVENEGAR_API_KEY');
    this.sender = config.get<string>('KAVENEGAR_SENDER');
  }

  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    await this.callKavenegar('/verify/lookup.json', {
      receptor: phoneNumber,
      token: code,
      template: 'otp-verify',
    });
  }

  async sendNotification(phoneNumber: string, message: string): Promise<void> {
    await this.callKavenegar('/sms/send.json', {
      receptor: phoneNumber,
      sender: this.sender,
      message,
    });
  }

  private async callKavenegar(
    path: string,
    params: Record<string, string | undefined>,
  ) {
    const url = `https://api.kavenegar.com/v1/${this.apiKey}${path}`;
    const body = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined) as [
        string,
        string,
      ][],
    );

    const res = await fetch(url, { method: 'POST', body });
    if (!res.ok) {
      throw new Error(
        `Kavenegar request failed: ${res.status} ${await res.text()}`,
      );
    }
  }
}
