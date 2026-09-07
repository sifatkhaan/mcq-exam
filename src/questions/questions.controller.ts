import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Post,
  Get,
  Param,
  Query,
  Req,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorators';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QuestionsService } from './questions.service';
import { QuestionImportService } from './question-import.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { FileInterceptor } from '@nestjs/platform-express';

type AuthenticatedRequest = Request & {
  user: {
    id: number;
    organization_id: number;
  };
};

@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'TEACHER')
export class QuestionsController {
  constructor(
    private readonly service: QuestionsService,
    private readonly questionImportService: QuestionImportService,
  ) {}
  @Post()
  create(
    @Body()
    dto: CreateQuestionDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.create(dto, req.user.id, req.user.organization_id);
  }

  @Get()
  findAll(
    @Req()
    req: AuthenticatedRequest,

    @Query('page')
    page?: string,

    @Query('page_size')
    pageSize?: string,

    @Query('search')
    search?: string,

    @Query('subject_id')
    subjectId?: string,

    @Query('chapter_id')
    chapterId?: string,

    @Query('topic_id')
    topicId?: string,

    @Query('difficulty')
    difficulty?: string,
  ) {
    const parsedPage = Math.max(Number(page) || 1, 1);
    const parsedPageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 100);
    const trimmedSearch = search?.trim() || undefined;

    return this.service.findAll(
      req.user.organization_id,
      subjectId ? Number(subjectId) : undefined,
      chapterId ? Number(chapterId) : undefined,
      topicId ? Number(topicId) : undefined,
      parsedPage,
      parsedPageSize,
      trimmedSearch,
      difficulty,
    );
  }

  @Get(':id/versions')
  getVersions(
    @Param('id')
    id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.getVersions(Number(id), req.user.organization_id);
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
    dto: UpdateQuestionDto,
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

  @Patch(':id/restore')
  restore(
    @Param('id')
    id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.restore(
      Number(id),
      req.user.id,
      req.user.organization_id,
    );
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importQuestions(
    @UploadedFile()
    file: Express.Multer.File | undefined,
    @Req()
    req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('Import file is required');
    }

    return this.questionImportService.importExcel(
      file,
      req.user.id,
      req.user.organization_id,
    );
  }
}
