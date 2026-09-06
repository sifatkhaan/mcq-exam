import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorators';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

type AuthenticatedRequest = Request & {
  user: {
    id: number;
    organization_id: number;
    role: string[];
  };
};

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'TEACHER')
export class SubjectsController {
  constructor(private readonly service: SubjectsService) {}

  @Post()
  create(
    @Body()
    dto: CreateSubjectDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.create(
      dto,
      req.user.id,
      req.user.organization_id,
      req.user.role,
    );
  }

  @Get()
  findAll(
    @Req()
    req: AuthenticatedRequest,
    @Query('organization_id')
    organizationId?: string,
  ) {
    const isSuperAdmin = req.user.role?.includes('SUPER_ADMIN') ?? false;
    if (isSuperAdmin) {
      if (!organizationId) {
        throw new BadRequestException('Organization is required');
      }

      return this.service.findAll(Number(organizationId));
    }
    return this.service.findAll(req.user.organization_id);
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: number,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.findOne(Number(id), req.user.organization_id);
  }

  @Patch(':id')
  update(
    @Param('id')
    id: number,
    @Body()
    dto: UpdateSubjectDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.update(
      Number(id),
      dto,
      req.user.id,
      req.user.organization_id,
    );
  }

  @Delete(':id')
  remove(
    @Param('id')
    id: number,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.remove(
      Number(id),
      req.user.id,
      req.user.organization_id,
    );
  }
}
