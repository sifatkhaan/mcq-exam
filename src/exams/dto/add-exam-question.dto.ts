import { IsInt, IsNumber, Min } from 'class-validator';

export class AddExamQuestionDto {
  @IsInt()
  question_version_id!: number;

  @IsInt()
  @Min(1)
  question_order!: number;

  @IsNumber()
  @Min(0)
  marks!: number;

  @IsNumber()
  @Min(0)
  negative_marks!: number;
}
