import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateRedirectDto {
  @IsString()
  fromPath!: string;

  @IsString()
  toPath!: string;

  @IsOptional()
  @IsIn([301, 302])
  statusCode?: number;
}
