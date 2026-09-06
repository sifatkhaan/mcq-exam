import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubjectDto {
  @IsOptional()
  @IsInt()
  organization_id?: number;

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
