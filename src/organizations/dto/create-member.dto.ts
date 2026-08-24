import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateMemberDto {
  @IsNotEmpty()
  @IsNumber()
  organization_id!: number;

  @IsNotEmpty()
  @IsNumber()
  user_id!: number;

  @IsNotEmpty()
  @IsNumber()
  role_id!: number;
}
