import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ImportQuestionDto {
  @IsString()
  @IsNotEmpty()
  subject_code!: string;

  @IsString()
  @IsNotEmpty()
  question_text!: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsString()
  @IsNotEmpty()
  correct_option!: string;

  @IsString()
  @IsNotEmpty()
  option_a!: string;

  @IsString()
  @IsNotEmpty()
  option_b!: string;

  @IsString()
  @IsNotEmpty()
  option_c!: string;

  @IsString()
  @IsNotEmpty()
  option_d!: string;

  @IsOptional()
  @IsString()
  option_e?: string;
}
