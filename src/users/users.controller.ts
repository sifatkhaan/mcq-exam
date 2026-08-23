import { Controller, Req, Get, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';

type AuthenticatedRequest = Request & {
  user?: {
    id: number;
    email: string;
  };
};

@Controller('users')
export class UsersController {
  @Get('profile')
  @Get('student-area')
  @Get('admin-area')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  @Roles('ADMIN')
  studentArea() {
    return {
      message: 'Welcome Student',
    };
  }
  adminArea() {
    return {
      message: 'Welcome Admin',
    };
  }
  profile(@Req() req: AuthenticatedRequest) {
    return {
      message: 'Protected Route',
      user: req.user,
    };
  }
}
