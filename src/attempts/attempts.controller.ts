import {
  Body,
  Controller,
  Get,
  UseGuards,
  Req,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { AttemptsService } from './attempts.service';
import { SaveAnswerDto } from './dto/save-answer.dto';

type AuthenticatedRequest = Request & {
  user: {
    id: number;
    organization_id: number;
  };
};
@Controller('attempts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class AttemptsController {
  constructor(private readonly service: AttemptsService) {}
  @Get('available-exams')
  getAvailableExams(
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.getAvailableExams(
      req.user.id,
      req.user.organization_id,
    );
  }
  @Post('exams/:examId/start')
  startExam(
    @Param('examId')
    examId: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.startExam(
      Number(examId),
      req.user.id,
      req.user.organization_id,
    );
  }
  @Get(':attemptId/questions')
  getQuestions(
    @Param('attemptId')
    attemptId: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.getAttemptQuestions(Number(attemptId), req.user.id);
  }

  @Put(':attemptId/answers/:examQuestionId')
  saveAnswer(
    @Param('attemptId')
    attemptId: string,
    @Param('examQuestionId')
    examQuestionId: string,
    @Body()
    dto: SaveAnswerDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.saveAnswer(
      Number(attemptId),
      Number(examQuestionId),
      dto.selected_option_id,
      req.user.id,
    );
  }

  @Post(':attemptId/submit')
  submit(
    @Param('attemptId')
    attemptId: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.submitAttempt(Number(attemptId), req.user.id, 'MANUAL');
  }

  @Get(':attemptId/result')
  getResult(
    @Param('attemptId')
    attemptId: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.getResult(Number(attemptId), req.user.id);
  }

  @Get(':attemptId/review')
  getReview(
    @Param('attemptId')
    attemptId: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.getReview(Number(attemptId), req.user.id);
  }

  @Get('history')
  getHistory(
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.service.getAttemptHistory(
      req.user.id,
      req.user.organization_id,
    );
  }
  @Get('analytics')
  getAnalytics(
    @Query('period')
    period: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    const selectedPeriod = period === 'monthly' ? 'monthly' : 'weekly';

    return this.service.getStudentAnalytics(
      req.user.id,
      req.user.organization_id,
      selectedPeriod,
    );
  }
  @Get('analytics/academic')
  getAcademicAnalytics(
    @Query('period')
    period: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    const selectedPeriod: 'weekly' | 'monthly' =
      period === 'monthly' ? 'monthly' : 'weekly';

    return this.service.getAcademicAnalytics(
      req.user.id,
      req.user.organization_id,
      selectedPeriod,
    );
  }
  @Get('reports/assessment')
  getAssessmentReport(
    @Query('period')
    period: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    const selectedPeriod: 'weekly' | 'monthly' =
      period === 'monthly' ? 'monthly' : 'weekly';

    return this.service.getAssessmentReport(
      req.user.id,
      req.user.organization_id,
      selectedPeriod,
    );
  }
}
