import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOptionDto } from './create-option.dto';
export class UpdateQuestionDto {
  @IsOptional()
  @IsInt()
  subject_id?: number;

  @IsOptional()
  @IsInt()
  chapter_id?: number;

  @IsOptional()
  @IsInt()
  topic_id?: number;

  @IsNotEmpty()
  @IsString()
  question_text!: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficulty?: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(5)
  @ValidateNested({
    each: true,
  })
  @Type(() => CreateOptionDto)
  options!: CreateOptionDto[];
}
