import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AttemptsService } from './attempts.service';

@Injectable()
export class AttemptsExpiryScheduler {
  private readonly logger = new Logger(AttemptsExpiryScheduler.name);
  constructor(private readonly attemptsService: AttemptsService) {}
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredAttempts() {
    try {
      const result = await this.attemptsService.processExpiredAttempts();

      if (result.processed > 0 || result.failed > 0) {
        this.logger.log(
          `Expired attempts processed: ${result.processed}, failed: ${result.failed}`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to process expired attempts', error);
    }
  }
}
