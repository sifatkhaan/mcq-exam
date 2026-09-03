import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamQuestion } from './entities/exam-question.entity';
import { Question } from '../questions/entities/question.entity';
import { QuestionVersion } from '../questions/entities/question-version.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { AddExamQuestionDto } from './dto/add-exam-question.dto';
import { ExamAssignment } from './entities/exam-assignment.entity';
import { User } from 'src/users/user.entity';
import { UserRole } from 'src/users/user-role.entity';
import { OrganizationMember } from 'src/organizations/entities/organization-member.entity';
import { AssignExamDto } from './dto/assign-exam.dto';
import { Role } from 'src/roles/role.entity';

type ExamRuleData = Pick<
  Partial<CreateExamDto>,
  | 'total_marks'
  | 'pass_marks'
  | 'duration_minutes'
  | 'max_attempts'
  | 'negative_marking_enabled'
  | 'default_negative_mark'
> & {
  start_at?: string | Date | null;
  end_at?: string | Date | null;
};

type ExamQuestionRow = {
  exam_question_id: number;
  exam_id: number;
  question_version_id: number;
  question_order: number;
  marks: number;
  negative_marks: number;
  question_id: number;
  version_no: number;
  question_text: string;
  difficulty: string;
  subject_name: string;
};
type ExamAssignmentRow = {
  assignment_id: number;
  exam_id: number;
  student_id: number;
  status: string;
  assigned_at: Date;
  completed_at: Date | null;
  student_username: string;
  student_email: string;
};
@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamQuestion)
    private readonly examQuestionRepository: Repository<ExamQuestion>,
    @InjectRepository(QuestionVersion)
    private readonly questionVersionRepository: Repository<QuestionVersion>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(ExamAssignment)
    private readonly examAssignmentRepository: Repository<ExamAssignment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,

    @InjectRepository(OrganizationMember)
    private readonly organizationMemberRepository: Repository<OrganizationMember>,
  ) {}
  async create(dto: CreateExamDto, userId: number, organizationId: number) {
    this.validateExamRules(dto);

    const exam = this.examRepository.create({
      ...dto,
      organization_id: organizationId,
      status: dto.status ?? 'DRAFT',
      created_by: userId,
      start_at: dto.start_at ? new Date(dto.start_at) : null,
      end_at: dto.end_at ? new Date(dto.end_at) : null,
    });

    return await this.examRepository.save(exam);
  }
  async findAll(organizationId: number, status?: string) {
    const query = this.examRepository
      .createQueryBuilder('exam')
      .where('exam.organization_id = :organizationId', { organizationId })
      .andWhere('exam.is_deleted = :isDeleted', { isDeleted: false });

    if (status) {
      query.andWhere('exam.status = :status', { status });
    }

    return await query.orderBy('exam.created_at', 'DESC').getMany();
  }
  async findOne(id: number, organizationId: number) {
    const exam = await this.examRepository.findOne({
      where: {
        id,
        organization_id: organizationId,
        is_deleted: false,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    return exam;
  }
  async update(
    id: number,
    dto: UpdateExamDto,
    userId: number,
    organizationId: number,
  ) {
    const exam = await this.findOne(id, organizationId);

    if (exam.status === 'ARCHIVED') {
      throw new BadRequestException('Archived exam cannot be updated');
    }

    const mergedData = {
      ...exam,
      ...dto,
    };

    this.validateExamRules(mergedData);

    await this.examRepository.update(id, {
      ...dto,
      start_at:
        dto.start_at !== undefined ? new Date(dto.start_at) : exam.start_at,
      end_at: dto.end_at !== undefined ? new Date(dto.end_at) : exam.end_at,
      updated_by: userId,
      updated_at: new Date(),
    });

    return this.findOne(id, organizationId);
  }
  async remove(id: number, userId: number, organizationId: number) {
    const exam = await this.findOne(id, organizationId);
    if (exam.status === 'PUBLISHED') {
      throw new BadRequestException(
        'Published exam cannot be deleted. Close or archive it first.',
      );
    }
    await this.examRepository.update(id, {
      is_deleted: true,
      status: 'ARCHIVED',
      deleted_by: userId,
      deleted_at: new Date(),
    });

    return {
      message: 'Exam deleted successfully',
    };
  }
  async publish(id: number, userId: number, organizationId: number) {
    const exam = await this.findOne(id, organizationId);

    if (exam.status !== 'DRAFT') {
      throw new BadRequestException('Only draft exams can be published');
    }

    this.validateExamRules(exam);
    const examQuestions = await this.examQuestionRepository.find({
      where: {
        exam_id: id,
      },
    });
    const calculatedMarks = examQuestions.reduce(
      (total, question) => total + Number(question.marks),
      0,
    );
    if (
      Number(calculatedMarks.toFixed(2)) !==
      Number(Number(exam.total_marks).toFixed(2))
    ) {
      throw new BadRequestException(
        `Question marks total (${calculatedMarks}) does not match exam total marks (${exam.total_marks})`,
      );
    }

    if (!exam.negative_marking_enabled) {
      const hasNegativeMarks = examQuestions.some(
        (question) => Number(question.negative_marks) > 0,
      );

      if (hasNegativeMarks) {
        throw new BadRequestException(
          'Negative marks exist in exam questions while negative marking is disabled',
        );
      }
    }

    await this.examRepository.update(id, {
      status: 'PUBLISHED',
      updated_by: userId,
      updated_at: new Date(),
    });

    return {
      message: 'Exam published successfully',
      exam: await this.findOne(id, organizationId),
      summary: {
        total_questions: examQuestions.length,
        calculated_marks: calculatedMarks,
      },
    };
  }
  async close(id: number, userId: number, organizationId: number) {
    const exam = await this.findOne(id, organizationId);

    if (exam.status !== 'PUBLISHED') {
      throw new BadRequestException('Only published exams can be closed');
    }

    await this.examRepository.update(id, {
      status: 'CLOSED',
      updated_by: userId,
      updated_at: new Date(),
    });

    return {
      message: 'Exam closed successfully',
    };
  }
  async closeExpiredExams() {
    const now = new Date();
    const result = await this.examRepository
      .createQueryBuilder()
      .update()
      .set({
        status: 'CLOSED',
        updated_at: now,
      })
      .where('status = :status', {
        status: 'PUBLISHED',
      })
      .andWhere('end_at IS NOT NULL')
      .andWhere('end_at <= :now', {
        now,
      })
      .execute();

    return {
      closed_exams: result.affected ?? 0,
    };
  }
  async archive(id: number, userId: number, organizationId: number) {
    const exam = await this.findOne(id, organizationId);
    if (exam.status === 'PUBLISHED') {
      throw new BadRequestException('Close the exam before archiving');
    }

    await this.examRepository.update(id, {
      status: 'ARCHIVED',
      updated_by: userId,
      updated_at: new Date(),
    });

    return {
      message: 'Exam archived successfully',
    };
  }
  private validateExamRules(data: ExamRuleData) {
    if (
      data.total_marks !== undefined &&
      data.pass_marks !== undefined &&
      Number(data.pass_marks) > Number(data.total_marks)
    ) {
      throw new BadRequestException('Pass marks cannot exceed total marks');
    }
    if (data.start_at && data.end_at) {
      const start = new Date(data.start_at);
      const end = new Date(data.end_at);
      if (end <= start) {
        throw new BadRequestException('End time must be after start time');
      }
    }
    if (
      data.duration_minutes !== undefined &&
      Number(data.duration_minutes) <= 0
    ) {
      throw new BadRequestException('Duration must be greater than 0');
    }
    if (data.max_attempts !== undefined && Number(data.max_attempts) < 1) {
      throw new BadRequestException('Maximum attempts must be at least 1');
    }
    if (
      data.negative_marking_enabled === true &&
      Number(data.default_negative_mark ?? 0) <= 0
    ) {
      throw new BadRequestException(
        'Negative mark must be greater than 0 when negative marking is enabled',
      );
    }
  }
  async addQuestion(
    examId: number,
    dto: AddExamQuestionDto,
    userId: number,
    organizationId: number,
  ) {
    console.log(examId, 'exam id');
    const exam = await this.findOne(examId, organizationId);

    if (exam.status !== 'DRAFT') {
      throw new BadRequestException(
        'Questions can only be added to a draft exam',
      );
    }

    const version = await this.questionVersionRepository.findOne({
      where: {
        id: dto.question_version_id,
      },
    });

    if (!version) {
      throw new BadRequestException('Question version not found');
    }

    const question = await this.questionRepository.findOne({
      where: {
        id: version.question_id,
        is_deleted: false,
      },
    });

    if (!question) {
      throw new BadRequestException('Question not found');
    }

    const subject = await this.subjectRepository.findOne({
      where: {
        id: question.subject_id,
        organization_id: organizationId,
        is_deleted: false,
      },
    });

    if (!subject) {
      throw new BadRequestException(
        'Question does not belong to your organization',
      );
    }

    const duplicateVersion = await this.examQuestionRepository.findOne({
      where: {
        exam_id: examId,
        question_version_id: dto.question_version_id,
      },
    });

    if (duplicateVersion) {
      throw new BadRequestException('Question already exists in this exam');
    }

    const duplicateOrder = await this.examQuestionRepository.findOne({
      where: {
        exam_id: examId,
        question_order: dto.question_order,
      },
    });

    if (duplicateOrder) {
      throw new BadRequestException(
        'Question order already exists in this exam',
      );
    }

    const examQuestion = this.examQuestionRepository.create({
      exam_id: examId,
      question_version_id: dto.question_version_id,
      question_order: dto.question_order,
      marks: dto.marks,
      negative_marks: exam.negative_marking_enabled ? dto.negative_marks : 0,
      created_by: userId,
    });

    return await this.examQuestionRepository.save(examQuestion);
  }
  async getQuestions(examId: number, organizationId: number) {
    await this.findOne(examId, organizationId);
    return await this.examQuestionRepository
      .createQueryBuilder('eq')
      .innerJoin(QuestionVersion, 'qv', 'qv.id = eq.question_version_id')
      .innerJoin(Question, 'q', 'q.id = qv.question_id')
      .innerJoin(Subject, 's', 's.id = q.subject_id')
      .where('eq.exam_id = :examId', { examId })
      .andWhere('s.organization_id = :organizationId', { organizationId })
      .select([
        'eq.id AS exam_question_id',
        'eq.exam_id AS exam_id',
        'eq.question_version_id AS question_version_id',
        'eq.question_order AS question_order',
        'eq.marks AS marks',
        'eq.negative_marks AS negative_marks',
        'q.id AS question_id',
        'qv.version_no AS version_no',
        'qv.question_text AS question_text',
        'qv.difficulty AS difficulty',
        's.name AS subject_name',
      ])
      .orderBy('eq.question_order', 'ASC')
      .getRawMany<ExamQuestionRow>();
  }
  async removeQuestion(
    examId: number,
    examQuestionId: number,
    organizationId: number,
  ) {
    const exam = await this.findOne(examId, organizationId);
    if (exam.status !== 'DRAFT') {
      throw new BadRequestException(
        'Questions can only be removed from a draft exam',
      );
    }
    const examQuestion = await this.examQuestionRepository.findOne({
      where: {
        id: examQuestionId,
        exam_id: examId,
      },
    });
    if (!examQuestion) {
      throw new NotFoundException('Exam question not found');
    }
    await this.examQuestionRepository.delete(examQuestion.id);
    return {
      message: 'Question removed from exam successfully',
    };
  }
  async assignStudent(
    examId: number,
    dto: AssignExamDto,
    userId: number,
    organizationId: number,
  ) {
    const exam = await this.findOne(examId, organizationId);
    if (exam.status !== 'DRAFT' && exam.status !== 'PUBLISHED') {
      throw new BadRequestException(
        'Students can only be assigned to draft or published exams',
      );
    }

    const student = await this.userRepository.findOne({
      where: {
        id: dto.student_id,
        status: 'ACTIVE',
      },
    });

    if (!student) {
      throw new BadRequestException('Student not found');
    }

    const studentRole = await this.userRoleRepository
      .createQueryBuilder('ur')
      .innerJoin(Role, 'r', 'r.id = ur.role_id')
      .where('ur.user_id = :studentId', {
        studentId: dto.student_id,
      })
      .andWhere('r.name = :roleName', {
        roleName: 'STUDENT',
      })
      .getOne();

    if (!studentRole) {
      throw new BadRequestException('Selected user is not a student');
    }

    const organizationMember = await this.organizationMemberRepository.findOne({
      where: {
        organization_id: organizationId,
        user_id: dto.student_id,
        status: 'ACTIVE',
      },
    });

    if (!organizationMember) {
      throw new BadRequestException(
        'Student does not belong to your organization',
      );
    }

    const existingAssignment = await this.examAssignmentRepository.findOne({
      where: {
        exam_id: examId,
        student_id: dto.student_id,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException('Student is already assigned to this exam');
    }

    const assignment = this.examAssignmentRepository.create({
      exam_id: examId,
      student_id: dto.student_id,
      status: 'ASSIGNED',
      assigned_by: userId,
    });

    return await this.examAssignmentRepository.save(assignment);
  }
  async getAssignments(examId: number, organizationId: number) {
    await this.findOne(examId, organizationId);
    return await this.examAssignmentRepository
      .createQueryBuilder('ea')
      .innerJoin(User, 'u', 'u.id = ea.student_id')
      .where('ea.exam_id = :examId', {
        examId,
      })
      .select([
        'ea.id AS assignment_id',
        'ea.exam_id AS exam_id',
        'ea.student_id AS student_id',
        'ea.status AS status',
        'ea.assigned_at AS assigned_at',
        'ea.completed_at AS completed_at',
        'u.username AS student_username',
        'u.email AS student_email',
      ])
      .orderBy('ea.assigned_at', 'DESC')
      .getRawMany<ExamAssignmentRow>();
  }
  async cancelAssignment(
    examId: number,
    assignmentId: number,
    organizationId: number,
  ) {
    const exam = await this.findOne(examId, organizationId);
    if (exam.status === 'ARCHIVED') {
      throw new BadRequestException('Archived exam cannot be modified');
    }
    const assignment = await this.examAssignmentRepository.findOne({
      where: {
        id: assignmentId,
        exam_id: examId,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Exam assignment not found');
    }

    if (assignment.status === 'COMPLETED') {
      throw new BadRequestException('Completed assignment cannot be cancelled');
    }

    await this.examAssignmentRepository.update(assignmentId, {
      status: 'CANCELLED',
    });

    return {
      message: 'Exam assignment cancelled successfully',
    };
  }
}
