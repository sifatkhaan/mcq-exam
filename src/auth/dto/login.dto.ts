import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  email!: string;

  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
