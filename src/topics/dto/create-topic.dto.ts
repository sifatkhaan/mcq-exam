import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTopicDto {
  @IsNumber()
  chapter_id!: number;

  @IsInt()
  @Min(1)
  topic_no!: number;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
