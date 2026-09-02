import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider } from '../sms-provider.interface';

@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger(ConsoleSmsProvider.name);

  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    this.logger.log(`[DEV SMS] OTP for ${phoneNumber}: ${code}`);
  }

  async sendNotification(phoneNumber: string, message: string): Promise<void> {
    this.logger.log(`[DEV SMS] Notification for ${phoneNumber}: ${message}`);
  }
}
