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
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
