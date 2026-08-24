import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

type AuthenticatedRequest = Request & {
  user: {
    id: number;
  };
};

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}
  @Post()
  create(
    @Body()
    dto: CreateOrganizationDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(Number(id));
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body()
    dto: UpdateOrganizationDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.update(Number(id), dto, req.user.id);
  }

  @Delete(':id')
  remove(
    @Param('id') id: number,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.remove(Number(id), req.user.id);
  }
}
