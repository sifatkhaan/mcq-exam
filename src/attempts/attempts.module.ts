import { Module } from '@nestjs/common';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamAttempt } from './entities/exam-attempt.entity';
import { AttemptAnswer } from './entities/attempt-answer.entity';
import { Exam } from 'src/exams/entities/exam.entity';
import { ExamQuestion } from 'src/exams/entities/exam-question.entity';
import { ExamAssignment } from 'src/exams/entities/exam-assignment.entity';
import { QuestionVersion } from 'src/questions/entities/question-version.entity';
import { QuestionOption } from 'src/questions/entities/question-option.entity';
import { User } from 'src/users/user.entity';
import { AttemptReportsController } from './attempt-reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamAttempt,
      AttemptAnswer,
      Exam,
      ExamQuestion,
      ExamAssignment,
      QuestionVersion,
      QuestionOption,
      User,
    ]),
  ],
  controllers: [AttemptsController, AttemptReportsController],
  providers: [AttemptsService],
})
export class AttemptsModule {}
