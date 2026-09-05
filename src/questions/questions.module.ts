import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { QuestionVersion } from './entities/question-version.entity';
import { QuestionOption } from './entities/question-option.entity';
import { Chapter } from '../chapters/entities/chapter.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Topic } from '../topics/entities/topic.entity';
import { MulterModule } from '@nestjs/platform-express';
import { QuestionImportService } from './question-import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Question,
      QuestionVersion,
      QuestionOption,
      Subject,
      Chapter,
      Topic,
    ]),
    MulterModule.register({}),
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionImportService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
