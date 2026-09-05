import { IsOptional, IsString } from 'class-validator';

export class RefundOrderDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
