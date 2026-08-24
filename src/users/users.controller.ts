import { Controller, Req, Get, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { RolesGuard } from '../auth/guards/roles.guard';

type AuthenticatedRequest = Request & {
  user?: {
    id: number;
    email: string;
    role: string;
  };
};

@Controller('users')
export class UsersController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@Req() req: AuthenticatedRequest) {
    return {
      message: 'Protected Route',
      user: req.user,
    };
  }

  @Get('student-area')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  studentArea() {
    return {
      message: 'Welcome Student',
    };
  }

  @Get('admin-area')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminArea() {
    return {
      message: 'Welcome Admin',
    };
  }

  @Get('context')
  @UseGuards(JwtAuthGuard)
  context(@Req() req: AuthenticatedRequest) {
    return {
      user: req.user,
    };
  }
}
