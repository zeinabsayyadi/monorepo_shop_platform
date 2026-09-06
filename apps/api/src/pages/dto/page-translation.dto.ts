import { IsIn, IsOptional, IsString } from 'class-validator';

export class PageTranslationDto {
  @IsIn(['fa', 'en'])
  locale!: 'fa' | 'en';

  @IsString()
  title!: string;

  @IsString()
  slug!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;
}
