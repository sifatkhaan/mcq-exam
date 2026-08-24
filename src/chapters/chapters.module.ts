import { Module } from '@nestjs/common';
import { ChaptersController } from './chapters.controller';
import { ChaptersService } from './chapters.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chapter } from './entities/chapter.entity';
import { Subject } from '../subjects/entities/subject.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chapter, Subject])],
  controllers: [ChaptersController],
  providers: [ChaptersService],
  exports: [ChaptersService],
})
export class ChaptersModule {}
