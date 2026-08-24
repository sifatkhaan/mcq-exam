import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrganizationDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  code!: string;

  @IsNotEmpty()
  @IsString()
  type!: string;

  @IsOptional()
  logo_url?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsOptional()
  phone?: string;
}
