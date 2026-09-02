import { Module } from '@nestjs/common';
import { ConsoleSmsProvider } from './providers/console.provider';
import { KavenegarSmsProvider } from './providers/kavenegar.provider';
import { SMS_PROVIDER } from './sms-provider.interface';

const useConsole = process.env.NODE_ENV !== 'production';

@Module({
  providers: [
    {
      provide: SMS_PROVIDER,
      useClass: useConsole ? ConsoleSmsProvider : KavenegarSmsProvider,
    },
  ],
  exports: [SMS_PROVIDER],
})
export class SmsModule {}
