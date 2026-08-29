import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExamAttempt } from './entities/exam-attempt.entity';
import { DataSource, In, Repository } from 'typeorm';
import { AttemptAnswer } from './entities/attempt-answer.entity';
import { Exam } from 'src/exams/entities/exam.entity';
import { ExamQuestion } from 'src/exams/entities/exam-question.entity';
import { ExamAssignment } from 'src/exams/entities/exam-assignment.entity';
import { QuestionVersion } from 'src/questions/entities/question-version.entity';
import { QuestionOption } from 'src/questions/entities/question-option.entity';
import { User } from 'src/users/user.entity';

type AvailableExamRows = {
  exam_id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  total_marks: number;
  pass_marks: number;
  start_at: Date | null;
  end_at: Date | null;
  max_attempts: number;
  assignment_id: number;
  assignment_status: string;
};

type AttemptQuestionOption = {
  id: number;
  option_order: number;
  option_text: string;
};

type AttemptQuestionResult = {
  exam_question_id: number;
  question_order: number;
  question_text: string;
  options: AttemptQuestionOption[];
  selected_option_id: number | null;
};

type ReviewAnswer = {
  option_id: number;
  option_text: string | null;
};

type ReviewOption = AttemptQuestionOption & {
  is_correct?: boolean;
};

type ReviewQuestion = {
  exam_question_id: number;
  question_order: number;
  question_text: string;
  your_answer: ReviewAnswer | null;
  is_correct: boolean;
  marks_awarded: number;
  correct_answer?: ReviewAnswer;
  explanation?: string;
  options: ReviewOption[];
};

type ReviewResult = {
  attempt: {
    id: number;
    exam_id: number;
    attempt_no: number;
    final_score: number;
    percentage: number;
    pass_status: string | null;
  };
  exam: {
    id: number;
    title: string;
    allow_review: boolean;
    show_correct_answer: boolean;
    show_explanation: boolean;
  };
  questions: ReviewQuestion[];
};

type AttemptHistoryRow = {
  attempt_id: number | string;
  exam_id: number | string;
  attempt_no: number | string;
  status: string;
  submission_type: string | null;
  started_at: Date;
  submitted_at: Date | null;
  total_questions: number | string | null;
  correct_count: number | string | null;
  wrong_count: number | string | null;
  unanswered_count: number | string | null;
  positive_marks: number | string | null;
  negative_marks: number | string | null;
  final_score: number | string | null;
  percentage: number | string | null;
  pass_status: string | null;
  exam_title: string;
  exam_total_marks: number | string | null;
  exam_pass_marks: number | string | null;
};

type AttemptHistoryResult = {
  attempt_id: number;
  exam_id: number;
  exam_title: string;
  attempt_no: number;
  submission_type: string | null;
  started_at: Date;
  submitted_at: Date | null;
  total_questions: number;
  correct: number;
  wrong: number;
  unanswered: number;
  positive_marks: number;
  negative_marks: number;
  final_score: number;
  total_marks: number;
  pass_marks: number;
  percentage: number;
  pass_status: string | null;
};

type AcademicAnalyticsRow = {
  answer_id: number | string;
  selected_option_id: number | string | null;
  is_correct: boolean | number | string | null;
  marks_awarded: number | string | null;
  exam_question_id: number | string;
  question_marks: number | string | null;
  subject_id: number | string | null;
  subject_name: string | null;
  chapter_id: number | string | null;
  chapter_name: string | null;
  topic_id: number | string | null;
  topic_name: string | null;
};

type AcademicAnalyticsIdKey = 'subject_id' | 'chapter_id' | 'topic_id';

type AcademicAnalyticsNameKey = 'subject_name' | 'chapter_name' | 'topic_name';

type AcademicAnalyticsGroup = {
  id: number;
  name: string | null;
  total_questions: number;
  correct: number;
  wrong: number;
  unanswered: number;
  earned_marks: number;
  possible_marks: number;
  percentage: number;
};

type AcademicAnalyticsResult = {
  period: 'weekly' | 'monthly';
  from_date: Date;
  to_date: Date;
  strongest_subject: AcademicAnalyticsGroup | null;
  weakest_subject: AcademicAnalyticsGroup | null;
  weak_chapters: AcademicAnalyticsGroup[];
  weak_topics: AcademicAnalyticsGroup[];
  subjects: AcademicAnalyticsGroup[];
  chapters: AcademicAnalyticsGroup[];
  topics: AcademicAnalyticsGroup[];
};

type PerformanceLevel = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'WEAK';
type PerformanceLevelWithNoData = PerformanceLevel | 'NO_DATA';

type StaffStudentRow = {
  id: number | string;
  name: string;
  email: string;
};

type StudentsPerformanceRow = {
  student_id: number | string;
  total_attempts: number | string | null;
  average_percentage: number | string | null;
  best_percentage: number | string | null;
  lowest_percentage: number | string | null;
  passed: number | string | null;
  failed: number | string | null;
};

type StudentPerformanceSummary = {
  student_id: number;
  name: string;
  email: string;
  total_attempts: number;
  passed: number;
  failed: number;
  pass_rate: number;
  average_percentage: number;
  best_percentage: number;
  lowest_percentage: number;
  performance_level: PerformanceLevelWithNoData;
};

type StudentsPerformanceSummaryResult = {
  period: 'weekly' | 'monthly';
  from_date: Date;
  to_date: Date;
  total_students: number;
  students: StudentPerformanceSummary[];
};

type ExamAnalyticsQuestionRow = {
  attempt_id: number | string | null;
  exam_question_id: number | string;
  question_order: number | string;
  question_marks: number | string | null;
  question_text: string;
  selected_option_id: number | string | null;
  is_correct: boolean | number | string | null;
  marks_awarded: number | string | null;
};

type ExamQuestionPerformanceAccumulator = {
  exam_question_id: number;
  question_order: number;
  question_text: string;
  marks: number;
  answered: number;
  correct: number;
  wrong: number;
  unanswered: number;
  total_marks_awarded: number;
};

type ExamQuestionPerformance = ExamQuestionPerformanceAccumulator & {
  total_responses: number;
  accuracy_rate: number;
  answer_rate: number;
};

type ExamAnalyticsResult = {
  period: 'weekly' | 'monthly';
  from_date: Date;
  to_date: Date;
  exam: {
    id: number;
    title: string;
    status: string;
    total_marks: number;
    pass_marks: number;
    max_attempts: number;
  };
  participation: {
    assigned_students: number;
    participants: number;
    non_participants: number;
    participation_rate: number;
    total_attempts: number;
  };
  result_summary: {
    passed: number;
    failed: number;
    pass_rate: number;
    average_score: number;
    average_percentage: number;
    highest_score: number | null;
    lowest_score: number | null;
    highest_percentage: number | null;
    lowest_percentage: number | null;
  };
  question_performance: ExamQuestionPerformance[];
  most_difficult_questions: ExamQuestionPerformance[];
  easiest_questions: ExamQuestionPerformance[];
};

@Injectable()
export class AttemptsService {
  constructor(
    @InjectRepository(ExamAttempt)
    private readonly examAttemptRepository: Repository<ExamAttempt>,
    @InjectRepository(AttemptAnswer)
    private readonly attemptAnswerRepository: Repository<AttemptAnswer>,
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamQuestion)
    private readonly examQuestionRepository: Repository<ExamQuestion>,
    @InjectRepository(ExamAssignment)
    private readonly examAssignmentRepository: Repository<ExamAssignment>,
    @InjectRepository(QuestionVersion)
    private readonly questionVersionRepository: Repository<QuestionVersion>,
    @InjectRepository(QuestionOption)
    private readonly questionOptionRepository: Repository<QuestionOption>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dataSource: DataSource,
  ) {}

  async getAvailableExams(studentId: number, organizationId: number) {
    const now = new Date();
    return await this.examAssignmentRepository
      .createQueryBuilder('ea')
      .innerJoin(Exam, 'exam', 'exam.id = ea.exam_id')
      .where('ea.student_id = :studentId', { studentId })
      .andWhere('ea.status = :assignmentStatus', {
        assignmentStatus: 'ASSIGNED',
      })
      .andWhere('exam.organization_id = :organizationId', { organizationId })
      .andWhere('exam.status = :examStatus', { examStatus: 'PUBLISHED' })
      .andWhere('exam.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('(exam.start_at IS NULL OR exam.start_at <= :now)', { now })
      .andWhere('(exam.end_at IS NULL OR exam.end_at >= :now)', { now })
      .select([
        'exam.id AS exam_id',
        'exam.title AS title',
        'exam.description AS description',
        'exam.duration_minutes AS duration_minutes',
        'exam.total_marks AS total_marks',
        'exam.pass_marks AS pass_marks',
        'exam.start_at AS start_at',
        'exam.end_at AS end_at',
        'exam.max_attempts AS max_attempts',
        'ea.id AS assignment_id',
        'ea.status AS assignment_status',
      ])
      .orderBy('exam.start_at', 'ASC')
      .getRawMany<AvailableExamRows>();
  }

  async startExam(examId: number, studentId: number, organizationId: number) {
    const exam = await this.examRepository.findOne({
      where: {
        id: examId,
        organization_id: organizationId,
        is_deleted: false,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.status !== 'PUBLISHED') {
      throw new BadRequestException('Exam is not available');
    }

    const now = new Date();

    if (exam.start_at && now < new Date(exam.start_at)) {
      throw new BadRequestException('Exam has not started yet');
    }

    if (exam.end_at && now > new Date(exam.end_at)) {
      throw new BadRequestException('Exam has already ended');
    }

    const assignment = await this.examAssignmentRepository.findOne({
      where: {
        exam_id: examId,
        student_id: studentId,
        status: 'ASSIGNED',
      },
    });

    if (!assignment) {
      throw new BadRequestException('You are not assigned to this exam');
    }
    // Check whether there is already an active attempt
    const activeAttempt = await this.examAttemptRepository.findOne({
      where: {
        exam_id: examId,
        student_id: studentId,
        status: 'STARTED',
      },
      order: {
        attempt_no: 'DESC',
      },
    });

    if (activeAttempt) {
      const activeExpiry = new Date(activeAttempt.expires_at);
      if (now < activeExpiry) {
        return {
          message: 'Existing active attempt found',
          attempt: activeAttempt,
        };
      }

      // await this.examAttemptRepository.update(activeAttempt.id, {
      //   status: 'AUTO_SUBMITTED',
      //   submission_type: 'TIME_EXPIRED',
      //   submitted_at: now,
      // });
      await this.submitAttempt(activeAttempt.id, studentId, 'TIME_EXPIRED');
    }

    const attemptCount = await this.examAttemptRepository.count({
      where: {
        exam_id: examId,
        student_id: studentId,
      },
    });

    if (attemptCount >= exam.max_attempts) {
      throw new BadRequestException('Maximum attempt limit reached');
    }

    const attemptNo = attemptCount + 1;

    const calculatedExpiry = new Date(
      now.getTime() + exam.duration_minutes * 60 * 1000,
    );

    // If exam.end_at comes before duration ends,
    // the actual expiry should be exam.end_at.
    let expiresAt = calculatedExpiry;

    if (exam.end_at && new Date(exam.end_at) < calculatedExpiry) {
      expiresAt = new Date(exam.end_at);
    }

    const questionCount = await this.examQuestionRepository.count({
      where: {
        exam_id: examId,
      },
    });

    if (questionCount === 0) {
      throw new BadRequestException('Exam has no questions');
    }

    const attempt = this.examAttemptRepository.create({
      exam_id: examId,
      student_id: studentId,
      assignment_id: assignment.id,
      attempt_no: attemptNo,
      status: 'STARTED',
      started_at: now,
      expires_at: expiresAt,
      total_questions: questionCount,
    });

    const savedAttempt = await this.examAttemptRepository.save(attempt);

    return {
      message: 'Exam started successfully',
      attempt: {
        id: savedAttempt.id,
        exam_id: savedAttempt.exam_id,
        attempt_no: savedAttempt.attempt_no,
        started_at: savedAttempt.started_at,
        expires_at: savedAttempt.expires_at,
        total_questions: savedAttempt.total_questions,
      },
    };
  }

  async getAttemptQuestions(attemptId: number, studentId: number) {
    const attempt = await this.examAttemptRepository.findOne({
      where: {
        id: attemptId,
        student_id: studentId,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }
    if (attempt.status !== 'STARTED') {
      throw new BadRequestException('Exam attempt is not active');
    }
    const now = new Date();
    if (now > new Date(attempt.expires_at)) {
      throw new BadRequestException('Exam time has expired');
    }
    const exam = await this.examRepository.findOne({
      where: {
        id: attempt.exam_id,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }
    const examQuestions = await this.examQuestionRepository.find({
      where: {
        exam_id: attempt.exam_id,
      },
      order: {
        question_order: 'ASC',
      },
    });
    const result: AttemptQuestionResult[] = [];
    for (const examQuestion of examQuestions) {
      const version = await this.questionVersionRepository.findOne({
        where: {
          id: examQuestion.question_version_id,
        },
      });

      if (!version) {
        continue;
      }

      const options = await this.questionOptionRepository.find({
        where: {
          question_version_id: version.id,
        },
        order: {
          option_order: 'ASC',
        },
      });

      const existingAnswer = await this.attemptAnswerRepository.findOne({
        where: {
          attempt_id: attemptId,
          exam_question_id: examQuestion.id,
        },
      });

      result.push({
        exam_question_id: examQuestion.id,
        question_order: examQuestion.question_order,
        question_text: version.question_text,
        options: options.map((option) => ({
          id: option.id,
          option_order: option.option_order,
          option_text: option.option_text,
        })),

        selected_option_id: existingAnswer?.selected_option_id ?? null,
      });
    }

    return {
      attempt: {
        id: attempt.id,
        exam_id: attempt.exam_id,
        started_at: attempt.started_at,
        expires_at: attempt.expires_at,
        total_questions: attempt.total_questions,
      },

      exam: {
        id: exam.id,
        title: exam.title,
        duration_minutes: exam.duration_minutes,
        shuffle_questions: exam.shuffle_questions,
        shuffle_options: exam.shuffle_options,
      },

      questions: result,
    };
  }

  async saveAnswer(
    attemptId: number,
    examQuestionId: number,
    selectedOptionId: number,
    studentId: number,
  ) {
    // --------------------------------
    // Validate attempt
    // --------------------------------

    const attempt = await this.examAttemptRepository.findOne({
      where: {
        id: attemptId,
        student_id: studentId,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.status !== 'STARTED') {
      throw new BadRequestException('Exam attempt is not active');
    }

    // --------------------------------
    // Validate time
    // --------------------------------

    const now = new Date();

    if (now > new Date(attempt.expires_at)) {
      throw new BadRequestException('Exam time has expired');
    }

    // --------------------------------
    // Validate exam question
    // --------------------------------

    const examQuestion = await this.examQuestionRepository.findOne({
      where: {
        id: examQuestionId,
        exam_id: attempt.exam_id,
      },
    });

    if (!examQuestion) {
      throw new BadRequestException('Question does not belong to this exam');
    }

    // --------------------------------
    // Validate selected option
    // --------------------------------

    const selectedOption = await this.questionOptionRepository.findOne({
      where: {
        id: selectedOptionId,

        question_version_id: examQuestion.question_version_id,
      },
    });

    if (!selectedOption) {
      throw new BadRequestException(
        'Selected option does not belong to this question',
      );
    }

    // --------------------------------
    // Check existing answer
    // --------------------------------

    const existingAnswer = await this.attemptAnswerRepository.findOne({
      where: {
        attempt_id: attemptId,
        exam_question_id: examQuestionId,
      },
    });

    // --------------------------------
    // Update answer
    // --------------------------------

    if (existingAnswer) {
      await this.attemptAnswerRepository.update(existingAnswer.id, {
        selected_option_id: selectedOptionId,
        // Do not evaluate yet
        is_correct: null,
        marks_awarded: null,
        updated_at: now,
      });

      return {
        message: 'Answer updated successfully',
        answer: {
          attempt_id: attemptId,
          exam_question_id: examQuestionId,
          selected_option_id: selectedOptionId,
        },
      };
    }

    // --------------------------------
    // Create answer
    // --------------------------------

    const answer = this.attemptAnswerRepository.create({
      attempt_id: attemptId,
      exam_question_id: examQuestionId,
      selected_option_id: selectedOptionId,
      is_correct: null,
      marks_awarded: null,
      answered_at: now,
      updated_at: null,
    });

    const savedAnswer = await this.attemptAnswerRepository.save(answer);

    return {
      message: 'Answer saved successfully',
      answer: {
        id: savedAnswer.id,
        attempt_id: savedAnswer.attempt_id,
        exam_question_id: savedAnswer.exam_question_id,
        selected_option_id: savedAnswer.selected_option_id,
      },
    };
  }

  async submitAttempt(
    attemptId: number,
    studentId: number,
    submissionType: 'MANUAL' | 'TIME_EXPIRED' = 'MANUAL',
  ) {
    const attempt = await this.examAttemptRepository.findOne({
      where: {
        id: attemptId,
        student_id: studentId,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.status !== 'STARTED') {
      throw new BadRequestException('Exam attempt has already been finalized');
    }

    const exam = await this.examRepository.findOne({
      where: {
        id: attempt.exam_id,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const now = new Date();

    if (submissionType === 'MANUAL' && now > new Date(attempt.expires_at)) {
      submissionType = 'TIME_EXPIRED';
    }

    const examQuestions = await this.examQuestionRepository.find({
      where: {
        exam_id: attempt.exam_id,
      },
      order: {
        question_order: 'ASC',
      },
    });

    if (examQuestions.length === 0) {
      throw new BadRequestException('Exam has no questions');
    }

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let positiveMarks = 0;
    let negativeMarks = 0;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const examQuestion of examQuestions) {
        const answer = await queryRunner.manager.findOne(AttemptAnswer, {
          where: {
            attempt_id: attemptId,
            exam_question_id: examQuestion.id,
          },
        });

        // --------------------------------
        // Unanswered
        // --------------------------------

        if (!answer || !answer.selected_option_id) {
          unansweredCount++;

          if (answer) {
            await queryRunner.manager.update(AttemptAnswer, answer.id, {
              is_correct: false,
              marks_awarded: 0,
            });
          }

          continue;
        }

        const selectedOption = await queryRunner.manager.findOne(
          QuestionOption,
          {
            where: {
              id: answer.selected_option_id,
              question_version_id: examQuestion.question_version_id,
            },
          },
        );

        if (!selectedOption) {
          throw new BadRequestException(
            `Invalid selected option for exam question ${examQuestion.id}`,
          );
        }

        // --------------------------------
        // Correct
        // --------------------------------

        if (selectedOption.is_correct) {
          correctCount++;
          const marks = Number(examQuestion.marks);
          positiveMarks += marks;
          await queryRunner.manager.update(AttemptAnswer, answer.id, {
            is_correct: true,
            marks_awarded: marks,
          });
        }

        // --------------------------------
        // Wrong
        // --------------------------------
        else {
          wrongCount++;
          let deduction = 0;
          if (exam.negative_marking_enabled) {
            deduction = Number(examQuestion.negative_marks);
          }
          negativeMarks += deduction;
          await queryRunner.manager.update(AttemptAnswer, answer.id, {
            is_correct: false,
            marks_awarded: deduction > 0 ? -deduction : 0,
          });
        }
      }
      const finalScore = positiveMarks - negativeMarks;
      const percentage =
        Number(exam.total_marks) > 0
          ? (finalScore / Number(exam.total_marks)) * 100
          : 0;
      const resultStatus =
        finalScore >= Number(exam.pass_marks) ? 'PASS' : 'FAIL';
      const finalAttemptStatus =
        submissionType === 'TIME_EXPIRED' ? 'AUTO_SUBMITTED' : 'SUBMITTED';

      await queryRunner.manager.update(ExamAttempt, attemptId, {
        status: finalAttemptStatus,
        submission_type: submissionType,
        submitted_at: now,
        total_questions: examQuestions.length,
        correct_count: correctCount,
        wrong_count: wrongCount,
        unanswered_count: unansweredCount,
        positive_marks: Number(positiveMarks.toFixed(2)),
        negative_marks: Number(negativeMarks.toFixed(2)),
        final_score: Number(finalScore.toFixed(2)),
        percentage: Number(percentage.toFixed(2)),
        pass_status: resultStatus,
      });

      // Mark assignment completed
      if (attempt.assignment_id) {
        const completedAttemptCount = await queryRunner.manager.count(
          ExamAttempt,
          {
            where: {
              exam_id: attempt.exam_id,
              student_id: studentId,
              status: In(['SUBMITTED', 'AUTO_SUBMITTED']),
            },
          },
        );

        const totalCompleted = completedAttemptCount + 1;
        if (totalCompleted >= Number(exam.max_attempts)) {
          await queryRunner.manager.update(
            ExamAssignment,
            attempt.assignment_id,
            {
              status: 'COMPLETED',
              completed_at: now,
            },
          );
        }
      }
      await queryRunner.commitTransaction();
      return {
        message:
          submissionType === 'TIME_EXPIRED'
            ? 'Exam auto-submitted successfully'
            : 'Exam submitted successfully',

        result: {
          attempt_id: attemptId,
          exam_id: attempt.exam_id,
          total_questions: examQuestions.length,
          correct: correctCount,
          wrong: wrongCount,
          unanswered: unansweredCount,
          positive_marks: Number(positiveMarks.toFixed(2)),
          negative_marks: Number(negativeMarks.toFixed(2)),
          final_score: Number(finalScore.toFixed(2)),
          total_marks: Number(exam.total_marks),
          percentage: Number(percentage.toFixed(2)),
          result_status: resultStatus,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async getResult(attemptId: number, studentId: number) {
    const attempt = await this.examAttemptRepository.findOne({
      where: {
        id: attemptId,
        student_id: studentId,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.status !== 'SUBMITTED' && attempt.status !== 'AUTO_SUBMITTED') {
      throw new BadRequestException('Result is not available yet');
    }

    const exam = await this.examRepository.findOne({
      where: {
        id: attempt.exam_id,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (!exam.show_result) {
      throw new BadRequestException('Result is not available for viewing yet');
    }

    return {
      attempt_id: attempt.id,
      exam: {
        id: exam.id,
        title: exam.title,
        total_marks: Number(exam.total_marks),
        pass_marks: Number(exam.pass_marks),
      },

      attempt_no: attempt.attempt_no,
      submission_type: attempt.submission_type,
      started_at: attempt.started_at,
      submitted_at: attempt.submitted_at,
      total_questions: attempt.total_questions,
      correct: attempt.correct_count,
      wrong: attempt.wrong_count,
      unanswered: attempt.unanswered_count,
      positive_marks: Number(attempt.positive_marks),
      negative_marks: Number(attempt.negative_marks),
      final_score: Number(attempt.final_score),
      percentage: Number(attempt.percentage),
      pass_status: attempt.pass_status,
    };
  }
  async getReview(attemptId: number, studentId: number): Promise<ReviewResult> {
    const attempt = await this.examAttemptRepository.findOne({
      where: {
        id: attemptId,
        student_id: studentId,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.status !== 'SUBMITTED' && attempt.status !== 'AUTO_SUBMITTED') {
      throw new BadRequestException(
        'Review is only available after submission',
      );
    }

    console.log(attempt, 'attempt');

    const exam = await this.examRepository.findOne({
      where: {
        id: attempt.exam_id,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (!exam.allow_review) {
      throw new BadRequestException(
        'Answer review is not allowed for this exam',
      );
    }

    const examQuestions = await this.examQuestionRepository.find({
      where: {
        exam_id: attempt.exam_id,
      },
      order: {
        question_order: 'ASC',
      },
    });

    const review: ReviewQuestion[] = [];

    for (const examQuestion of examQuestions) {
      const version = await this.questionVersionRepository.findOne({
        where: {
          id: examQuestion.question_version_id,
        },
      });

      if (!version) {
        continue;
      }

      const options = await this.questionOptionRepository.find({
        where: {
          question_version_id: version.id,
        },
        order: {
          option_order: 'ASC',
        },
      });

      const answer = await this.attemptAnswerRepository.findOne({
        where: {
          attempt_id: attemptId,
          exam_question_id: examQuestion.id,
        },
      });

      const correctOption = options.find((option) => option.is_correct);

      review.push({
        exam_question_id: examQuestion.id,
        question_order: examQuestion.question_order,
        question_text: version.question_text,
        your_answer: answer?.selected_option_id
          ? {
              option_id: answer.selected_option_id,
              option_text:
                options.find(
                  (option) => option.id === answer.selected_option_id,
                )?.option_text ?? null,
            }
          : null,

        is_correct: answer?.is_correct ?? false,
        marks_awarded:
          answer?.marks_awarded !== null && answer?.marks_awarded !== undefined
            ? Number(answer.marks_awarded)
            : 0,

        correct_answer:
          exam.show_correct_answer && correctOption
            ? {
                option_id: correctOption.id,
                option_text: correctOption.option_text,
              }
            : undefined,

        explanation: exam.show_explanation ? version.explanation : undefined,
        options: options.map((option) => ({
          id: option.id,
          option_order: option.option_order,
          option_text: option.option_text,
          ...(exam.show_correct_answer
            ? {
                is_correct: option.is_correct,
              }
            : {}),
        })),
      });
    }

    return {
      attempt: {
        id: attempt.id,
        exam_id: attempt.exam_id,
        attempt_no: attempt.attempt_no,
        final_score: Number(attempt.final_score),
        percentage: Number(attempt.percentage),
        pass_status: attempt.pass_status,
      },

      exam: {
        id: exam.id,
        title: exam.title,
        allow_review: exam.allow_review,
        show_correct_answer: exam.show_correct_answer,
        show_explanation: exam.show_explanation,
      },
      questions: review,
    };
  }

  async getAttemptHistory(
    studentId: number,
    organizationId: number,
  ): Promise<AttemptHistoryResult[]> {
    const attempts = await this.examAttemptRepository
      .createQueryBuilder('attempt')
      .innerJoin('exams', 'exam', 'exam.id = attempt.exam_id')
      .where('attempt.student_id = :studentId', { studentId })
      .andWhere('exam.organization_id = :organizationId', { organizationId })
      .andWhere(`attempt.status IN (:...statuses)`, {
        statuses: ['SUBMITTED', 'AUTO_SUBMITTED'],
      })
      .select([
        'attempt.id AS attempt_id',
        'attempt.exam_id AS exam_id',
        'attempt.attempt_no AS attempt_no',
        'attempt.status AS status',
        'attempt.submission_type AS submission_type',
        'attempt.started_at AS started_at',
        'attempt.submitted_at AS submitted_at',
        'attempt.total_questions AS total_questions',
        'attempt.correct_count AS correct_count',
        'attempt.wrong_count AS wrong_count',
        'attempt.unanswered_count AS unanswered_count',
        'attempt.positive_marks AS positive_marks',
        'attempt.negative_marks AS negative_marks',
        'attempt.final_score AS final_score',
        'attempt.percentage AS percentage',
        'attempt.pass_status AS pass_status',

        'exam.title AS exam_title',
        'exam.total_marks AS exam_total_marks',
        'exam.pass_marks AS exam_pass_marks',
      ])
      .orderBy('attempt.submitted_at', 'DESC')
      .getRawMany<AttemptHistoryRow>();

    return attempts.map((attempt) => ({
      attempt_id: Number(attempt.attempt_id),
      exam_id: Number(attempt.exam_id),
      exam_title: attempt.exam_title,
      attempt_no: Number(attempt.attempt_no),
      submission_type: attempt.submission_type,
      started_at: attempt.started_at,
      submitted_at: attempt.submitted_at,
      total_questions: Number(attempt.total_questions ?? 0),
      correct: Number(attempt.correct_count ?? 0),
      wrong: Number(attempt.wrong_count ?? 0),
      unanswered: Number(attempt.unanswered_count ?? 0),
      positive_marks: Number(attempt.positive_marks ?? 0),
      negative_marks: Number(attempt.negative_marks ?? 0),
      final_score: Number(attempt.final_score ?? 0),
      total_marks: Number(attempt.exam_total_marks ?? 0),
      pass_marks: Number(attempt.exam_pass_marks ?? 0),
      percentage: Number(attempt.percentage ?? 0),
      pass_status: attempt.pass_status,
    }));
  }

  async getStudentAnalytics(
    studentId: number,
    organizationId: number,
    period: 'weekly' | 'monthly' = 'weekly',
  ) {
    const now = new Date();
    let fromDate: Date;
    if (period === 'monthly') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      fromDate = new Date(now);
      fromDate.setDate(now.getDate() - diffToMonday);
      fromDate.setHours(0, 0, 0, 0);
    }

    const attempts = await this.examAttemptRepository
      .createQueryBuilder('attempt')
      .innerJoin('exams', 'exam', 'exam.id = attempt.exam_id')
      .where('attempt.student_id = :studentId', {
        studentId,
      })
      .andWhere('exam.organization_id = :organizationId', {
        organizationId,
      })
      .andWhere(`attempt.status IN (:...statuses)`, {
        statuses: ['SUBMITTED', 'AUTO_SUBMITTED'],
      })
      .andWhere('attempt.submitted_at >= :fromDate', {
        fromDate,
      })
      .andWhere('attempt.submitted_at <= :now', {
        now,
      })
      .select([
        'attempt.id AS attempt_id',
        'attempt.exam_id AS exam_id',
        'attempt.submitted_at AS submitted_at',
        'attempt.final_score AS final_score',
        'attempt.percentage AS percentage',
        'attempt.pass_status AS pass_status',
        'exam.title AS exam_title',
        'exam.total_marks AS total_marks',
      ])
      .orderBy('attempt.submitted_at', 'ASC')
      .getRawMany<AttemptHistoryResult>();
    if (attempts.length === 0) {
      return {
        period,
        from_date: fromDate,
        to_date: now,
        summary: {
          total_exams: 0,
          passed: 0,
          failed: 0,
          pass_rate: 0,
          average_percentage: 0,
          average_score: 0,
          best_percentage: 0,
          lowest_percentage: 0,
        },

        trend: [],
      };
    }
    const totalExams = attempts.length;
    const passed = attempts.filter(
      (item) => item.pass_status === 'PASS',
    ).length;

    const failed = attempts.filter(
      (item) => item.pass_status === 'FAIL',
    ).length;

    const percentages = attempts.map((item) => Number(item.percentage ?? 0));
    const scores = attempts.map((item) => Number(item.final_score ?? 0));
    const averagePercentage =
      percentages.reduce((sum, value) => sum + value, 0) / totalExams;
    const averageScore =
      scores.reduce((sum, value) => sum + value, 0) / totalExams;
    const passRate = totalExams > 0 ? (passed / totalExams) * 100 : 0;
    const bestPercentage = Math.max(...percentages);
    const lowestPercentage = Math.min(...percentages);

    return {
      period,
      from_date: fromDate,
      to_date: now,
      summary: {
        total_exams: totalExams,
        passed,
        failed,
        pass_rate: Number(passRate.toFixed(2)),
        average_percentage: Number(averagePercentage.toFixed(2)),
        average_score: Number(averageScore.toFixed(2)),
        best_percentage: Number(bestPercentage.toFixed(2)),
        lowest_percentage: Number(lowestPercentage.toFixed(2)),
      },

      trend: attempts.map((item) => ({
        attempt_id: Number(item.attempt_id),
        exam_id: Number(item.exam_id),
        exam_title: item.exam_title,
        submitted_at: item.submitted_at,
        final_score: Number(item.final_score ?? 0),
        total_marks: Number(item.total_marks ?? 0),
        percentage: Number(item.percentage ?? 0),
        pass_status: item.pass_status,
      })),
    };
  }

  async getAcademicAnalytics(
    studentId: number,
    organizationId: number,
    period: 'weekly' | 'monthly' = 'weekly',
  ): Promise<AcademicAnalyticsResult> {
    const now = new Date();

    let fromDate: Date;

    // --------------------------------
    // Determine date range
    // --------------------------------
    if (period === 'monthly') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);

      fromDate.setHours(0, 0, 0, 0);
    } else {
      const day = now.getDay();

      const diffToMonday = day === 0 ? 6 : day - 1;

      fromDate = new Date(now);

      fromDate.setDate(now.getDate() - diffToMonday);

      fromDate.setHours(0, 0, 0, 0);
    }

    // --------------------------------
    // Load every question from
    // submitted attempts
    //
    // IMPORTANT:
    // exam_questions is the main source,
    // attempt_answers is LEFT JOINED.
    //
    // This allows unanswered questions
    // to still appear in analytics.
    // --------------------------------
    const rows = await this.examAttemptRepository
      .createQueryBuilder('attempt')
      .innerJoin('exams', 'exam', 'exam.id = attempt.exam_id')
      .innerJoin('exam_questions', 'eq', 'eq.exam_id = attempt.exam_id')
      .innerJoin('question_versions', 'qv', 'qv.id = eq.question_version_id')
      .innerJoin('questions', 'q', 'q.id = qv.question_id')
      .leftJoin(
        'attempt_answers',
        'answer',
        `
          answer.attempt_id = attempt.id
          AND answer.exam_question_id = eq.id
        `,
      )
      .leftJoin('subjects', 'subject', 'subject.id = q.subject_id')
      .leftJoin('chapters', 'chapter', 'chapter.id = q.chapter_id')
      .leftJoin('topics', 'topic', 'topic.id = q.topic_id')
      .where('attempt.student_id = :studentId', {
        studentId,
      })
      .andWhere('exam.organization_id = :organizationId', {
        organizationId,
      })
      .andWhere(`attempt.status IN (:...statuses)`, {
        statuses: ['SUBMITTED', 'AUTO_SUBMITTED'],
      })
      .andWhere('attempt.submitted_at >= :fromDate', {
        fromDate,
      })
      .andWhere('attempt.submitted_at <= :now', {
        now,
      })
      .select([
        // Attempt
        'attempt.id AS attempt_id',
        // Answer
        'answer.selected_option_id AS selected_option_id',
        'answer.is_correct AS is_correct',
        'answer.marks_awarded AS marks_awarded',
        // Exam Question
        'eq.id AS exam_question_id',
        'eq.marks AS question_marks',
        // Subject
        'subject.id AS subject_id',
        'subject.name AS subject_name',
        // Chapter
        'chapter.id AS chapter_id',
        'chapter.name AS chapter_name',
        // Topic
        'topic.id AS topic_id',
        'topic.name AS topic_name',
      ])

      .getRawMany<AcademicAnalyticsRow>();

    // --------------------------------
    // Common aggregation function
    // --------------------------------

    const aggregate = (
      data: AcademicAnalyticsRow[],
      idKey: AcademicAnalyticsIdKey,
      nameKey: AcademicAnalyticsNameKey,
    ): AcademicAnalyticsGroup[] => {
      const map = new Map<number, Omit<AcademicAnalyticsGroup, 'percentage'>>();

      for (const row of data) {
        const rawId = row[idKey];

        if (rawId === null || rawId === undefined) {
          continue;
        }

        const id = Number(rawId);

        if (!map.has(id)) {
          map.set(id, {
            id,
            name: row[nameKey],
            total_questions: 0,
            correct: 0,
            wrong: 0,
            unanswered: 0,
            earned_marks: 0,
            possible_marks: 0,
          });
        }

        const item = map.get(id);

        if (!item) {
          continue;
        }

        // --------------------------------
        // Total questions
        // --------------------------------
        item.total_questions++;
        // --------------------------------
        // Possible marks
        // --------------------------------
        const possibleMarks = Number(row.question_marks ?? 0);
        item.possible_marks += possibleMarks;
        // --------------------------------
        // Correct / Wrong / Unanswered
        // --------------------------------
        if (
          row.selected_option_id === null ||
          row.selected_option_id === undefined
        ) {
          item.unanswered++;
        } else {
          const isCorrect =
            row.is_correct === true ||
            row.is_correct === 1 ||
            row.is_correct === '1';

          if (isCorrect) {
            item.correct++;
          } else {
            item.wrong++;
          }
        }

        // --------------------------------
        // Marks earned
        //
        // Correct:
        // + marks
        //
        // Wrong with negative marking:
        // - negative marks
        //
        // Unanswered:
        // 0
        // --------------------------------
        item.earned_marks += Number(row.marks_awarded ?? 0);
      }

      // --------------------------------
      // Convert Map -> Array
      // --------------------------------
      return Array.from(map.values()).map((item) => {
        const percentage =
          item.possible_marks > 0
            ? (item.earned_marks / item.possible_marks) * 100
            : 0;

        return {
          ...item,
          earned_marks: Number(item.earned_marks.toFixed(2)),
          possible_marks: Number(item.possible_marks.toFixed(2)),
          percentage: Number(percentage.toFixed(2)),
        };
      });
    };

    // --------------------------------
    // Subject analytics
    // --------------------------------
    const subjects = aggregate(rows, 'subject_id', 'subject_name');
    // --------------------------------
    // Chapter analytics
    // --------------------------------
    const chapters = aggregate(rows, 'chapter_id', 'chapter_name');
    // --------------------------------
    // Topic analytics
    // --------------------------------
    const topics = aggregate(rows, 'topic_id', 'topic_name');
    // --------------------------------
    // Sort strongest -> weakest
    // --------------------------------
    subjects.sort((a, b) => b.percentage - a.percentage);
    chapters.sort((a, b) => b.percentage - a.percentage);
    topics.sort((a, b) => b.percentage - a.percentage);
    // --------------------------------
    // Weak areas
    //
    // For now:
    // below 50% = weak
    // --------------------------------
    const weakChapters = chapters.filter((item) => item.percentage < 50);
    const weakTopics = topics.filter((item) => item.percentage < 50);
    // --------------------------------
    // Strongest / Weakest subject
    // --------------------------------
    const strongestSubject = subjects.length > 0 ? subjects[0] : null;
    const weakestSubject =
      subjects.length > 0 ? subjects[subjects.length - 1] : null;
    // --------------------------------
    // Final response
    // --------------------------------
    return {
      period,
      from_date: fromDate,
      to_date: now,
      strongest_subject: strongestSubject,
      weakest_subject: weakestSubject,
      weak_chapters: weakChapters,
      weak_topics: weakTopics,
      subjects,
      chapters,
      topics,
    };
  }

  async getAssessmentReport(
    studentId: number,
    organizationId: number,
    period: 'weekly' | 'monthly' = 'weekly',
  ) {
    // --------------------------------
    // Reuse existing analytics methods
    // --------------------------------
    const general = await this.getStudentAnalytics(
      studentId,
      organizationId,
      period,
    );

    const academic = await this.getAcademicAnalytics(
      studentId,
      organizationId,
      period,
    );

    console.log(general, 'genaral');
    const totalAttempts = Number(general.summary?.total_exams ?? 0);

    // --------------------------------
    // Performance level helper
    // --------------------------------
    const getPerformanceLevel = (percentage: number): PerformanceLevel => {
      if (percentage >= 80) {
        return 'EXCELLENT';
      }

      if (percentage >= 70) {
        return 'GOOD';
      }

      if (percentage >= 50) {
        return 'AVERAGE';
      }

      return 'WEAK';
    };

    const averagePercentage = Number(general.summary?.average_percentage ?? 0);
    const performanceLevel =
      totalAttempts === 0 ? 'NO_DATA' : getPerformanceLevel(averagePercentage);

    // --------------------------------
    // Build recommendations
    // --------------------------------
    const recommendations: string[] = [];

    if (academic.weakest_subject) {
      recommendations.push(`Focus more on ${academic.weakest_subject.name}.`);
    }

    if (academic.weak_chapters?.length) {
      const names = academic.weak_chapters
        .slice(0, 3)
        .map((item) => item.name)
        .join(', ');

      recommendations.push(`Revise weak chapters: ${names}.`);
    }

    if (academic.weak_topics?.length) {
      const names = academic.weak_topics
        .slice(0, 5)
        .map((item) => item.name)
        .join(', ');

      recommendations.push(`Practice more questions from: ${names}.`);
    }

    if (averagePercentage >= 80) {
      recommendations.push(
        'Overall performance is strong. Continue regular practice to maintain consistency.',
      );
    } else if (averagePercentage >= 70) {
      recommendations.push(
        'Performance is good, but weaker academic areas should receive additional practice.',
      );
    } else if (averagePercentage >= 50) {
      recommendations.push(
        'Performance is average. More revision and regular practice are recommended.',
      );
    } else {
      recommendations.push(
        'Performance needs improvement. Focus on fundamentals and weak topics before attempting advanced questions.',
      );
    }

    // --------------------------------
    // Final assessment report
    // --------------------------------
    return {
      report_type: 'STUDENT_ASSESSMENT',
      period,
      from_date: general.from_date,
      to_date: general.to_date,
      // --------------------------------
      // Overall summary
      // --------------------------------
      overall: {
        total_attempts: general.summary?.total_exams ?? 0,
        passed: general.summary?.passed ?? 0,
        failed: general.summary?.failed ?? 0,
        pass_rate: Number(general.summary?.pass_rate ?? 0),
        average_percentage: averagePercentage,
        average_score: Number(general.summary?.average_score ?? 0),
        best_percentage: Number(general.summary?.best_percentage ?? 0),
        lowest_percentage: Number(general.summary?.lowest_percentage ?? 0),
        performance_level: performanceLevel,
      },

      // --------------------------------
      // Academic summary
      // --------------------------------
      academic: {
        strongest_subject: academic.strongest_subject,
        weakest_subject: academic.weakest_subject,
        weak_chapters: academic.weak_chapters ?? [],
        weak_topics: academic.weak_topics ?? [],
      },

      performance_level: performanceLevel,
      // --------------------------------
      // Full subject performance
      // --------------------------------
      subject_performance: academic.subjects ?? [],
      // --------------------------------
      // Full chapter performance
      // --------------------------------
      chapter_performance: academic.chapters ?? [],
      // --------------------------------
      // Full topic performance
      // --------------------------------
      topic_performance: academic.topics ?? [],
      // -------------------------------
      // Exam / attempt trend
      // --------------------------------
      performance_trend: general.trend ?? [],
      // --------------------------------
      // Human-readable recommendation
      // --------------------------------
      recommendations,
    };
  }

  async getStudentAssessmentForStaff(
    studentId: number,
    organizationId: number,
    period: 'weekly' | 'monthly' = 'weekly',
  ) {
    // --------------------------------
    // Validate student
    // --------------------------------

    const student = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user_roles', 'ur', 'ur.user_id = user.id')
      .innerJoin('roles', 'role', 'role.id = ur.role_id')
      .innerJoin(
        'organization_members',
        'om',
        `
        om.user_id = "user"."id"
        AND om.organization_id = :organizationId
      `,
        {
          organizationId,
        },
      )
      .where('user.id = :studentId', {
        studentId,
      })
      .andWhere('user.status = :status', {
        status: 'ACTIVE',
      })
      .andWhere('role.name = :role', {
        role: 'STUDENT',
      })
      .select(['user.id AS id', 'user.username AS name', 'user.email AS email'])
      .getRawOne<StaffStudentRow>();

    if (!student) {
      throw new NotFoundException('Student not found in this organization');
    }

    // --------------------------------
    // Reuse existing report
    // --------------------------------

    const report = await this.getAssessmentReport(
      studentId,
      organizationId,
      period,
    );

    return {
      student: {
        id: Number(student.id),
        name: student.name,
        email: student.email,
      },

      ...report,
    };
  }
  async getStudentsPerformanceSummary(
    organizationId: number,
    period: 'weekly' | 'monthly' = 'weekly',
  ): Promise<StudentsPerformanceSummaryResult> {
    const now = new Date();

    let fromDate: Date;

    if (period === 'monthly') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);

      fromDate.setHours(0, 0, 0, 0);
    } else {
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      fromDate = new Date(now);
      fromDate.setDate(now.getDate() - diffToMonday);
      fromDate.setHours(0, 0, 0, 0);
    }

    // --------------------------------
    // Get all STUDENT users
    // inside this organization
    // --------------------------------
    const students = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin(
        'organization_members',
        'om',
        `
          om.user_id = "user"."id"
          AND om.organization_id = :organizationId
        `,
        {
          organizationId,
        },
      )
      .innerJoin('user_roles', 'ur', 'ur.user_id = user.id')
      .innerJoin('roles', 'role', 'role.id = ur.role_id')
      .where('role.name = :role', {
        role: 'STUDENT',
      })
      .andWhere('user.status = :status', {
        status: 'ACTIVE',
      })
      .select(['user.id AS id', 'user.username AS name', 'user.email AS email'])
      .orderBy('user.username', 'ASC')
      .getRawMany<StaffStudentRow>();

    if (students.length === 0) {
      return {
        period,
        from_date: fromDate,
        to_date: now,
        total_students: 0,
        students: [],
      };
    }

    const studentIds = students.map((student) => Number(student.id));

    // --------------------------------
    // Aggregate attempt performance
    // --------------------------------
    const performanceRows = await this.examAttemptRepository
      .createQueryBuilder('attempt')
      .innerJoin('exams', 'exam', 'exam.id = attempt.exam_id')
      .where('attempt.student_id IN (:...studentIds)', {
        studentIds,
      })
      .andWhere('exam.organization_id = :organizationId', {
        organizationId,
      })
      .andWhere(
        `
          attempt.status IN (:...statuses)
        `,
        {
          statuses: ['SUBMITTED', 'AUTO_SUBMITTED'],
        },
      )
      .andWhere('attempt.submitted_at >= :fromDate', {
        fromDate,
      })
      .andWhere('attempt.submitted_at <= :now', {
        now,
      })
      .select('attempt.student_id', 'student_id')
      .addSelect('COUNT(attempt.id)', 'total_attempts')
      .addSelect('AVG(attempt.percentage)', 'average_percentage')
      .addSelect('MAX(attempt.percentage)', 'best_percentage')
      .addSelect('MIN(attempt.percentage)', 'lowest_percentage')
      .addSelect(
        `
          SUM(
            CASE
              WHEN attempt.pass_status = 'PASS'
              THEN 1
              ELSE 0
            END
          )
        `,
        'passed',
      )
      .addSelect(
        `
          SUM(
            CASE
              WHEN attempt.pass_status = 'FAIL'
              THEN 1
              ELSE 0
            END
          )
        `,
        'failed',
      )
      .groupBy('attempt.student_id')
      .getRawMany<StudentsPerformanceRow>();

    // --------------------------------
    // Performance lookup
    // --------------------------------
    const performanceMap = new Map<number, StudentsPerformanceRow>();

    for (const row of performanceRows) {
      performanceMap.set(Number(row.student_id), row);
    }

    // --------------------------------
    // Build final student list
    // --------------------------------
    const result: StudentPerformanceSummary[] = students.map((student) => {
      const studentId = Number(student.id);

      const performance = performanceMap.get(studentId);

      if (!performance) {
        return {
          student_id: studentId,
          name: student.name,
          email: student.email,
          total_attempts: 0,
          passed: 0,
          failed: 0,
          pass_rate: 0,
          average_percentage: 0,
          best_percentage: 0,
          lowest_percentage: 0,
          performance_level: 'NO_DATA',
        };
      }

      const totalAttempts = Number(performance.total_attempts ?? 0);
      const passed = Number(performance.passed ?? 0);
      const failed = Number(performance.failed ?? 0);
      const averagePercentage = Number(performance.average_percentage ?? 0);
      const passRate = totalAttempts > 0 ? (passed / totalAttempts) * 100 : 0;
      let performanceLevel: PerformanceLevelWithNoData;

      if (totalAttempts === 0) {
        performanceLevel = 'NO_DATA';
      } else if (averagePercentage >= 80) {
        performanceLevel = 'EXCELLENT';
      } else if (averagePercentage >= 70) {
        performanceLevel = 'GOOD';
      } else if (averagePercentage >= 50) {
        performanceLevel = 'AVERAGE';
      } else {
        performanceLevel = 'WEAK';
      }

      return {
        student_id: studentId,
        name: student.name,
        email: student.email,
        total_attempts: totalAttempts,
        passed,
        failed,
        pass_rate: Number(passRate.toFixed(2)),
        average_percentage: Number(averagePercentage.toFixed(2)),
        best_percentage: Number(
          Number(performance.best_percentage ?? 0).toFixed(2),
        ),
        lowest_percentage: Number(
          Number(performance.lowest_percentage ?? 0).toFixed(2),
        ),
        performance_level: performanceLevel,
      };
    });

    return {
      period,
      from_date: fromDate,
      to_date: now,
      total_students: result.length,
      students: result,
    };
  }
  async getOrganizationDashboard(
    organizationId: number,
    period: 'weekly' | 'monthly' = 'weekly',
  ) {
    const now = new Date();
    let fromDate: Date;
    // --------------------------------
    // Date range
    // --------------------------------
    if (period === 'monthly') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      fromDate.setHours(0, 0, 0, 0);
    } else {
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      fromDate = new Date(now);
      fromDate.setDate(now.getDate() - diffToMonday);
      fromDate.setHours(0, 0, 0, 0);
    }

    // --------------------------------
    // Reuse Step 80
    //
    // This already:
    // - gets STUDENT users
    // - restricts organization
    // - calculates their performance
    // --------------------------------
    const studentPerformance = await this.getStudentsPerformanceSummary(
      organizationId,
      period,
    );

    const students = studentPerformance.students ?? [];
    // --------------------------------
    // Basic student statistics
    // --------------------------------
    const totalStudents = students.length;
    const participatingStudents = students.filter(
      (student) => Number(student.total_attempts) > 0,
    );
    const studentsWithNoAttempts = students.filter(
      (student) => Number(student.total_attempts) === 0,
    );
    const participatedCount = participatingStudents.length;
    const noAttemptCount = studentsWithNoAttempts.length;
    // --------------------------------
    // Attempt statistics
    // --------------------------------
    const totalAttempts = students.reduce(
      (sum, student) => sum + Number(student.total_attempts ?? 0),
      0,
    );

    const totalPassed = students.reduce(
      (sum, student) => sum + Number(student.passed ?? 0),
      0,
    );

    const totalFailed = students.reduce(
      (sum, student) => sum + Number(student.failed ?? 0),
      0,
    );

    const passRate =
      totalAttempts > 0 ? (totalPassed / totalAttempts) * 100 : 0;

    // --------------------------------
    // Organization average
    //
    // IMPORTANT:
    // We calculate from students who
    // actually have attempts.
    //
    // NO_DATA students should not
    // artificially reduce the average.
    // --------------------------------
    const organizationAverage =
      participatedCount > 0
        ? participatingStudents.reduce(
            (sum, student) => sum + Number(student.average_percentage ?? 0),
            0,
          ) / participatedCount
        : 0;

    // --------------------------------
    // Best / lowest student average
    // --------------------------------
    const studentPercentages = participatingStudents.map((student) =>
      Number(student.average_percentage ?? 0),
    );

    const bestAverage =
      studentPercentages.length > 0 ? Math.max(...studentPercentages) : 0;

    const lowestAverage =
      studentPercentages.length > 0 ? Math.min(...studentPercentages) : 0;

    // --------------------------------
    // Participation rate
    // --------------------------------
    const participationRate =
      totalStudents > 0 ? (participatedCount / totalStudents) * 100 : 0;

    // --------------------------------
    // Performance level counts
    // --------------------------------
    const excellentCount = students.filter(
      (student) => student.performance_level === 'EXCELLENT',
    ).length;
    const goodCount = students.filter(
      (student) => student.performance_level === 'GOOD',
    ).length;
    const averageCount = students.filter(
      (student) => student.performance_level === 'AVERAGE',
    ).length;
    const weakCount = students.filter(
      (student) => student.performance_level === 'WEAK',
    ).length;
    // --------------------------------
    // Top performers
    // --------------------------------
    const topPerformers = [...participatingStudents]
      .sort(
        (a, b) =>
          Number(b.average_percentage ?? 0) - Number(a.average_percentage ?? 0),
      )
      .slice(0, 5)
      .map((student) => ({
        student_id: student.student_id,
        name: student.name,
        total_attempts: student.total_attempts,
        average_percentage: student.average_percentage,
        pass_rate: student.pass_rate,
        performance_level: student.performance_level,
      }));

    // --------------------------------
    // Students needing attention
    //
    // For now:
    // average performance < 50%
    // --------------------------------
    const needsAttention = participatingStudents
      .filter((student) => Number(student.average_percentage ?? 0) < 50)
      .sort(
        (a, b) =>
          Number(a.average_percentage ?? 0) - Number(b.average_percentage ?? 0),
      )
      .slice(0, 10)
      .map((student) => ({
        student_id: student.student_id,
        name: student.name,
        total_attempts: student.total_attempts,
        average_percentage: student.average_percentage,
        pass_rate: student.pass_rate,
        performance_level: student.performance_level,
      }));

    // --------------------------------
    // No participation
    // --------------------------------
    const noParticipation = studentsWithNoAttempts
      .slice(0, 10)
      .map((student) => ({
        student_id: student.student_id,
        name: student.name,
        email: student.email,
      }));

    // --------------------------------
    // Final response
    // --------------------------------
    return {
      period,
      from_date: fromDate,
      to_date: now,
      students: {
        total: totalStudents,
        participated: participatedCount,
        no_attempts: noAttemptCount,
        participation_rate: Number(participationRate.toFixed(2)),
      },

      attempts: {
        total: totalAttempts,
        passed: totalPassed,
        failed: totalFailed,
        pass_rate: Number(passRate.toFixed(2)),
      },

      performance: {
        average_percentage: Number(organizationAverage.toFixed(2)),
        best_average: Number(bestAverage.toFixed(2)),
        lowest_average: Number(lowestAverage.toFixed(2)),
      },

      performance_distribution: {
        excellent: excellentCount,
        good: goodCount,
        average: averageCount,
        weak: weakCount,
        no_data: noAttemptCount,
      },
      top_performers: topPerformers,
      needs_attention: needsAttention,
      no_participation: noParticipation,
    };
  }

  async getExamAnalytics(
    examId: number,
    organizationId: number,
    period: 'weekly' | 'monthly' = 'weekly',
  ): Promise<ExamAnalyticsResult> {
    const now = new Date();
    let fromDate: Date;
    // --------------------------------
    // Date range
    // --------------------------------
    if (period === 'monthly') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);

      fromDate.setHours(0, 0, 0, 0);
    } else {
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      fromDate = new Date(now);
      fromDate.setDate(now.getDate() - diffToMonday);
      fromDate.setHours(0, 0, 0, 0);
    }

    // --------------------------------
    // Validate exam belongs
    // to current organization
    // --------------------------------
    const exam = await this.examRepository.findOne({
      where: {
        id: examId,
        organization_id: organizationId,
        is_deleted: false,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found in this organization');
    }

    // --------------------------------
    // Assignment summary
    // --------------------------------
    const assignments = await this.examAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.exam_id = :examId', {
        examId,
      })
      .andWhere(
        `
          assignment.status IN (:...statuses)
        `,
        {
          statuses: ['ASSIGNED', 'COMPLETED'],
        },
      )
      .getMany();

    const assignedStudents = assignments.length;

    // --------------------------------
    // Submitted attempts
    // --------------------------------
    const attempts = await this.examAttemptRepository
      .createQueryBuilder('attempt')

      .where('attempt.exam_id = :examId', {
        examId,
      })

      .andWhere(
        `
          attempt.status IN (:...statuses)
        `,
        {
          statuses: ['SUBMITTED', 'AUTO_SUBMITTED'],
        },
      )
      .andWhere('attempt.submitted_at >= :fromDate', {
        fromDate,
      })

      .andWhere('attempt.submitted_at <= :now', {
        now,
      })

      .orderBy('attempt.submitted_at', 'ASC')

      .getMany();

    const totalAttempts = attempts.length;

    // --------------------------------
    // Unique participants
    // --------------------------------
    const participantIds = new Set<number>();

    for (const attempt of attempts) {
      participantIds.add(Number(attempt.student_id));
    }

    const participants = participantIds.size;

    const nonParticipants = Math.max(assignedStudents - participants, 0);

    const participationRate =
      assignedStudents > 0 ? (participants / assignedStudents) * 100 : 0;

    // --------------------------------
    // Attempt performance
    // --------------------------------
    let passed = 0;
    let failed = 0;

    let totalScore = 0;
    let totalPercentage = 0;

    let highestScore: number | null = null;

    let lowestScore: number | null = null;

    let highestPercentage: number | null = null;

    let lowestPercentage: number | null = null;

    for (const attempt of attempts) {
      const score = Number(attempt.final_score ?? 0);

      const percentage = Number(attempt.percentage ?? 0);

      totalScore += score;

      totalPercentage += percentage;

      if (attempt.pass_status === 'PASS') {
        passed++;
      }

      if (attempt.pass_status === 'FAIL') {
        failed++;
      }

      if (highestScore === null || score > highestScore) {
        highestScore = score;
      }

      if (lowestScore === null || score < lowestScore) {
        lowestScore = score;
      }

      if (highestPercentage === null || percentage > highestPercentage) {
        highestPercentage = percentage;
      }

      if (lowestPercentage === null || percentage < lowestPercentage) {
        lowestPercentage = percentage;
      }
    }

    const averageScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;

    const averagePercentage =
      totalAttempts > 0 ? totalPercentage / totalAttempts : 0;

    const passRate = totalAttempts > 0 ? (passed / totalAttempts) * 100 : 0;

    // --------------------------------
    // Question-level analytics
    //
    // IMPORTANT:
    // Base table = exam_questions
    // LEFT JOIN attempt_answers
    //
    // So unanswered questions are
    // also included.
    // --------------------------------
    const questionRows = await this.examAttemptRepository
      .createQueryBuilder('attempt')

      .innerJoin('exam_questions', 'eq', 'eq.exam_id = attempt.exam_id')

      .innerJoin('question_versions', 'qv', 'qv.id = eq.question_version_id')

      .innerJoin('questions', 'q', 'q.id = qv.question_id')

      .leftJoin(
        'attempt_answers',
        'answer',
        `
        answer.attempt_id = attempt.id
        AND answer.exam_question_id = eq.id
      `,
      )

      .where('attempt.exam_id = :examId', {
        examId,
      })

      .andWhere(
        `
        attempt.status IN (:...statuses)
      `,
        {
          statuses: ['SUBMITTED', 'AUTO_SUBMITTED'],
        },
      )

      .andWhere('attempt.submitted_at >= :fromDate', {
        fromDate,
      })

      .andWhere('attempt.submitted_at <= :now', {
        now,
      })

      .select([
        'attempt.id AS attempt_id',

        'eq.id AS exam_question_id',
        'eq.question_order AS question_order',
        'eq.marks AS question_marks',

        'qv.question_text AS question_text',

        'answer.selected_option_id AS selected_option_id',
        'answer.is_correct AS is_correct',
        'answer.marks_awarded AS marks_awarded',
      ])

      .orderBy('eq.question_order', 'ASC')

      .getRawMany<ExamAnalyticsQuestionRow>();
    // --------------------------------
    // Aggregate question performance
    // --------------------------------
    const questionMap = new Map<number, ExamQuestionPerformanceAccumulator>();

    for (const row of questionRows) {
      const questionId = Number(row.exam_question_id);

      if (!questionMap.has(questionId)) {
        questionMap.set(questionId, {
          exam_question_id: questionId,

          question_order: Number(row.question_order),

          question_text: row.question_text,

          marks: Number(row.question_marks ?? 0),

          answered: 0,

          correct: 0,

          wrong: 0,

          unanswered: 0,

          total_marks_awarded: 0,
        });
      }

      const item = questionMap.get(questionId);

      if (!item) {
        continue;
      }

      // No matching submitted attempt
      if (!row.attempt_id) {
        continue;
      }

      if (
        row.selected_option_id === null ||
        row.selected_option_id === undefined
      ) {
        item.unanswered++;
      } else {
        item.answered++;

        const isCorrect =
          row.is_correct === true ||
          row.is_correct === 1 ||
          row.is_correct === '1';

        if (isCorrect) {
          item.correct++;
        } else {
          item.wrong++;
        }
      }

      item.total_marks_awarded += Number(row.marks_awarded ?? 0);
    }

    const questionPerformance: ExamQuestionPerformance[] = Array.from(
      questionMap.values(),
    ).map((item) => {
      const totalResponses = item.correct + item.wrong + item.unanswered;

      const accuracyRate =
        totalResponses > 0 ? (item.correct / totalResponses) * 100 : 0;

      const answerRate =
        totalResponses > 0 ? (item.answered / totalResponses) * 100 : 0;

      return {
        ...item,

        total_responses: totalResponses,

        accuracy_rate: Number(accuracyRate.toFixed(2)),

        answer_rate: Number(answerRate.toFixed(2)),

        total_marks_awarded: Number(item.total_marks_awarded.toFixed(2)),
      };
    });

    // --------------------------------
    // Difficult / easy questions
    // --------------------------------
    const questionsWithData = questionPerformance.filter(
      (question) => question.total_responses > 0,
    );

    const mostDifficultQuestions = [...questionsWithData]
      .sort((a, b) => a.accuracy_rate - b.accuracy_rate)
      .slice(0, 5);

    const easiestQuestions = [...questionsWithData]
      .sort((a, b) => b.accuracy_rate - a.accuracy_rate)
      .slice(0, 5);

    // --------------------------------
    // Final response
    // --------------------------------
    return {
      period,

      from_date: fromDate,

      to_date: now,

      exam: {
        id: exam.id,

        title: exam.title,

        status: exam.status,

        total_marks: Number(exam.total_marks),

        pass_marks: Number(exam.pass_marks),

        max_attempts: exam.max_attempts,
      },

      participation: {
        assigned_students: assignedStudents,

        participants,

        non_participants: nonParticipants,

        participation_rate: Number(participationRate.toFixed(2)),

        total_attempts: totalAttempts,
      },

      result_summary: {
        passed,

        failed,

        pass_rate: Number(passRate.toFixed(2)),

        average_score: Number(averageScore.toFixed(2)),

        average_percentage: Number(averagePercentage.toFixed(2)),

        highest_score:
          highestScore === null ? null : Number(highestScore.toFixed(2)),

        lowest_score:
          lowestScore === null ? null : Number(lowestScore.toFixed(2)),

        highest_percentage:
          highestPercentage === null
            ? null
            : Number(highestPercentage.toFixed(2)),

        lowest_percentage:
          lowestPercentage === null
            ? null
            : Number(lowestPercentage.toFixed(2)),
      },

      question_performance: questionPerformance,

      most_difficult_questions: mostDifficultQuestions,

      easiest_questions: easiestQuestions,
    };
  }
}
