import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsIn(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
  status!: 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

  @IsOptional()
  @IsString()
  trackingNo?: string;
}
