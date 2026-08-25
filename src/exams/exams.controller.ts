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
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { AddExamQuestionDto } from './dto/add-exam-question.dto';

type AuthenticatedRequest = Request & {
  user: {
    id: number;
    organization_id: number;
  };
};

@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'TEACHER')
export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  @Post()
  create(
    @Body()
    dto: CreateExamDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.create(dto, req.user.id, req.user.organization_id);
  }

  @Get()
  findAll(
    @Req()
    req: AuthenticatedRequest,
    @Query('status')
    status?: string,
  ) {
    return this.service.findAll(req.user.organization_id, status);
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.findOne(Number(id), req.user.organization_id);
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,
    @Body()
    dto: UpdateExamDto,
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

  @Patch(':id/publish')
  publish(
    @Param('id')
    id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.publish(
      Number(id),
      req.user.id,
      req.user.organization_id,
    );
  }

  @Patch(':id/close')
  close(
    @Param('id')
    id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.close(
      Number(id),
      req.user.id,
      req.user.organization_id,
    );
  }

  @Patch(':id/archive')
  archive(
    @Param('id')
    id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.archive(
      Number(id),
      req.user.id,
      req.user.organization_id,
    );
  }
  @Post(':id/questions')
  addQuestion(
    @Param('id')
    id: string,
    @Body()
    dto: AddExamQuestionDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.addQuestion(
      Number(id),
      dto,
      req.user.id,
      req.user.organization_id,
    );
  }

  @Get(':id/questions')
  getQuestions(
    @Param('id')
    id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.getQuestions(Number(id), req.user.organization_id);
  }

  @Delete(':id/questions/:examQuestionId')
  removeQuestion(
    @Param('id')
    id: string,
    @Param('examQuestionId')
    examQuestionId: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.removeQuestion(
      Number(id),
      Number(examQuestionId),
      req.user.organization_id,
    );
  }
}
