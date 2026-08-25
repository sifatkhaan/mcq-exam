import { IsBoolean, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateOptionDto {
  @IsInt()
  @Min(1)
  option_order!: number;

  @IsNotEmpty()
  @IsString()
  option_text!: string;

  @IsBoolean()
  is_correct!: boolean;
}
