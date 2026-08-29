import { IsInt } from 'class-validator';

export class SaveAnswerDto {
  @IsInt()
  selected_option_id!: number;
}
