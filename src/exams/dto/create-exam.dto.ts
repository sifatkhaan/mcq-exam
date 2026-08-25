import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateExamDto {
  @IsNotEmpty()
  @IsString()
  title!: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsInt()
  @Min(1)
  duration_minutes!: number;
  @IsNumber()
  @Min(0)
  total_marks!: number;
  @IsNumber()
  @Min(0)
  pass_marks!: number;
  @IsOptional()
  @IsBoolean()
  negative_marking_enabled?: boolean;
  @IsOptional()
  @IsNumber()
  @Min(0)
  default_correct_mark?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  default_negative_mark?: number;
  @IsOptional()
  @IsBoolean()
  shuffle_questions?: boolean;
  @IsOptional()
  @IsBoolean()
  shuffle_options?: boolean;
  @IsOptional()
  @IsBoolean()
  show_result?: boolean;
  @IsOptional()
  @IsBoolean()
  allow_review?: boolean;
  @IsOptional()
  @IsBoolean()
  show_correct_answer?: boolean;
  @IsOptional()
  @IsBoolean()
  show_explanation?: boolean;
  @IsOptional()
  @IsInt()
  @Min(1)
  max_attempts?: number;
  @IsOptional()
  @IsDateString()
  start_at?: string;
  @IsOptional()
  @IsDateString()
  end_at?: string;
  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'])
  status?: string;
}
