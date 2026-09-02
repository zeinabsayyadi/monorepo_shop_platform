import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\+98\d{10}$/)
  phoneNumber!: string;

  @IsString()
  @Length(5, 6)
  code!: string;
}
