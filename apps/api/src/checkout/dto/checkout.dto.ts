import { IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @IsString()
  addressId!: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
