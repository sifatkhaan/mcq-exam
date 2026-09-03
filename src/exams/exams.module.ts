import { Module } from '@nestjs/common';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/exam-question.entity';
import { Question } from '../questions/entities/question.entity';
import { QuestionVersion } from '../questions/entities/question-version.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { ExamAssignment } from './entities/exam-assignment.entity';
import { User } from 'src/users/user.entity';
import { UserRole } from 'src/users/user-role.entity';
import { Role } from 'src/roles/role.entity';
import { OrganizationMember } from 'src/organizations/entities/organization-member.entity';
import { ExamsLifecycleScheduler } from './exams-lifecycle.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Exam,
      ExamQuestion,
      ExamAssignment,

      QuestionVersion,
      Question,
      Subject,

      User,
      UserRole,
      Role,
      OrganizationMember,
    ]),
  ],
  controllers: [ExamsController],
  providers: [ExamsService, ExamsLifecycleScheduler],
  exports: [ExamsService],
})
export class ExamsModule {}
