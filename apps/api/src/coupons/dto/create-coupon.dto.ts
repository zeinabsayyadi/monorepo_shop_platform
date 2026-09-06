import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCouponDto {
  @IsString()
  code!: string;

  @IsIn(['PERCENTAGE', 'FIXED'])
  type!: 'PERCENTAGE' | 'FIXED';

  @IsInt()
  @Min(1)
  value!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderTotal?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptions?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
