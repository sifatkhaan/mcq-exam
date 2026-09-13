import { Body, Controller, Param, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/:organizationCode')
  async register(
    @Param('organizationCode') organizationCode: string,
    @Body() dto: RegisterDto,
  ) {
    return await this.authService.register(dto, organizationCode);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto.email, dto.password);
  }

  @Post('login/:organizationCode')
  async loginByOrganization(
    @Param('organizationCode') organizationCode: string,
    @Body() dto: LoginDto,
  ) {
    return await this.authService.loginByOrganization(
      dto.email,
      dto.password,
      organizationCode,
    );
  }
}
