import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { PageTranslationDto } from './page-translation.dto';

export class CreatePageDto {
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PageTranslationDto)
  translations!: PageTranslationDto[];
}
