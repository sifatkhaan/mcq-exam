import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';

type AuthenticatedRequest = Request & {
  user: {
    id: number;
    organization_id: number;
  };
};

@Controller('attempt-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'TEACHER')
export class AttemptReportsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Get('students/:studentId')
  getStudentReport(
    @Param('studentId')
    studentId: string,
    @Query('period')
    period: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    const selectedPeriod: 'weekly' | 'monthly' =
      period === 'monthly' ? 'monthly' : 'weekly';
    return this.attemptsService.getStudentAssessmentForStaff(
      Number(studentId),
      req.user.organization_id,
      selectedPeriod,
    );
  }
  @Get('students')
  getStudentsPerformance(
    @Query('period')
    period: string,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const selectedPeriod: 'weekly' | 'monthly' =
      period === 'monthly' ? 'monthly' : 'weekly';

    return this.attemptsService.getStudentsPerformanceSummary(
      req.user.organization_id,
      selectedPeriod,
    );
  }
  @Get('dashboard')
  getOrganizationDashboard(
    @Query('period')
    period: string,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const selectedPeriod: 'weekly' | 'monthly' =
      period === 'monthly' ? 'monthly' : 'weekly';

    return this.attemptsService.getOrganizationDashboard(
      req.user.organization_id,
      selectedPeriod,
    );
  }
  @Get('exams/:examId')
  getExamAnalytics(
    @Param('examId')
    examId: string,

    @Query('period')
    period: string,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const selectedPeriod: 'weekly' | 'monthly' =
      period === 'monthly' ? 'monthly' : 'weekly';

    return this.attemptsService.getExamAnalytics(
      Number(examId),
      req.user.organization_id,
      selectedPeriod,
    );
  }
  @Get('exams/:examId/students')
  getExamStudentResults(
    @Param('examId')
    examId: string,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.attemptsService.getExamStudentResults(
      Number(examId),
      req.user.organization_id,
    );
  }
  @Get('attempts/:attemptId')
  getStaffAttemptDetail(
    @Param('attemptId')
    attemptId: string,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.attemptsService.getStaffAttemptDetail(
      Number(attemptId),
      req.user.organization_id,
    );
  }
}
