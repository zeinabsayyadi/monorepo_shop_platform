import { IsIn, IsString } from 'class-validator';

export class CategoryTranslationDto {
  @IsIn(['fa', 'en'])
  locale!: 'fa' | 'en';

  @IsString()
  name!: string;

  @IsString()
  slug!: string;
}
