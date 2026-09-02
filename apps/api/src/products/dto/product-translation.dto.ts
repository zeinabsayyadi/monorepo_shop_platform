import { IsIn, IsOptional, IsString } from 'class-validator';

export class ProductTranslationDto {
  @IsIn(['fa', 'en'])
  locale!: 'fa' | 'en';

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  slug!: string;
}
