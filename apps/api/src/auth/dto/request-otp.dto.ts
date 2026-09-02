import { IsString, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @Matches(/^\+98\d{10}$/, {
    message:
      'phoneNumber must be a valid Iranian E.164 number, e.g. +989121234567',
  })
  phoneNumber!: string;
}
