import {
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

import { ChaptersService } from './chapters.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

type AuthenticatedRequest = Request & {
  user: {
    id: number;
    organization_id: number;
  };
};

@Controller('chapters')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'TEACHER')
export class ChaptersController {
  constructor(private readonly service: ChaptersService) {}

  @Post()
  create(
    @Body() dto: CreateChapterDto,

    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.create(
      dto,

      req.user.id,

      req.user.organization_id,
    );
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('subject_id')
    subjectId?: string,
  ) {
    return this.service.findAll(
      req.user.organization_id,
      subjectId ? Number(subjectId) : undefined,
    );
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.findOne(
      Number(id),

      req.user.organization_id,
    );
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateChapterDto,

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
    id: string,

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
