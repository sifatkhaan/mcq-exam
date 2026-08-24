import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSubjectDto {
  @IsNumber()
  organization_id!: number;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
