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
import type { Request } from 'express';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

type AuthenticatedRequest = Request & {
  user: {
    id: number;
    organization_id: number;
  };
};

@Controller('topics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'TEACHER')
export class TopicsController {
  constructor(private readonly service: TopicsService) {}

  @Post()
  create(@Body() dto: CreateTopicDto, @Req() req: AuthenticatedRequest) {
    return this.service.create(dto, req.user.id, req.user.organization_id);
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,

    @Query('chapter_id')
    chapterId?: string,
  ) {
    return this.service.findAll(
      req.user.organization_id,

      chapterId ? Number(chapterId) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.findOne(Number(id), req.user.organization_id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,

    @Body()
    dto: UpdateTopicDto,

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
    @Param('id') id: string,

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
