import { IsInt } from 'class-validator';
export class AssignExamDto {
  @IsInt()
  student_id!: number;
}
