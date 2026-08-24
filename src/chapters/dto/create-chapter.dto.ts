import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateChapterDto {
  @IsNumber()
  subject_id!: number;

  @IsInt()
  @Min(1)
  chapter_no!: number;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
