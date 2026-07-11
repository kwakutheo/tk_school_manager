import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSchoolDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  slug?: string;
}
