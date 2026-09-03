import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExamsService } from './exams.service';
@Injectable()
export class ExamsLifecycleScheduler {
  private readonly logger = new Logger(ExamsLifecycleScheduler.name);
  constructor(private readonly examsService: ExamsService) {}
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExamLifecycle() {
    try {
      const result = await this.examsService.closeExpiredExams();
      if (result.closed_exams > 0) {
        this.logger.log(`Closed expired exams: ${result.closed_exams}`);
      }
    } catch (error) {
      this.logger.error('Exam lifecycle scheduler failed', error);
    }
  }
}
