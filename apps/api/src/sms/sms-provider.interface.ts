export interface SmsProvider {
  sendOtp(phoneNumber: string, code: string): Promise<void>;
  sendNotification(phoneNumber: string, message: string): Promise<void>;
}

export const SMS_PROVIDER = 'SMS_PROVIDER';
