import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CreateOptionDto } from './create-option.dto';
export class CreateQuestionDto {
  @IsInt()
  subject_id!: number;

  @IsInt()
  chapter_id!: number;

  @IsInt()
  topic_id!: number;

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
