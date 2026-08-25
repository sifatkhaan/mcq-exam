import { Module } from '@nestjs/common';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/exam-question.entity';
import { Question } from '../questions/entities/question.entity';
import { QuestionVersion } from '../questions/entities/question-version.entity';
import { Subject } from '../subjects/entities/subject.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Exam,
      ExamQuestion,
      QuestionVersion,
      Question,
      Subject,
    ]),
  ],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
