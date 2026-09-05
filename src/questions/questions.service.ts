import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { DataSource, Repository } from 'typeorm';
import { QuestionVersion } from './entities/question-version.entity';
import { QuestionOption } from './entities/question-option.entity';
import { Chapter } from '../chapters/entities/chapter.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Topic } from '../topics/entities/topic.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

type QuestionListRow = {
  id: number;
  subject_id: number;
  chapter_id: number;
  topic_id: number;
  status: string;
  subject_name: string;
  chapter_no: number;
  chapter_name: string;
  topic_no: number;
  topic_name: string;
};

type QuestionDetailItem = QuestionListRow & {
  version: QuestionVersion & {
    options: QuestionOption[];
  };
};

type QuestionVersionWithOptions = QuestionVersion & {
  options: QuestionOption[];
};

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(QuestionVersion)
    private readonly versionRepository: Repository<QuestionVersion>,
    @InjectRepository(QuestionOption)
    private readonly optionRepository: Repository<QuestionOption>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateQuestionDto, userId: number, organizationId: number) {
    const subject = await this.subjectRepository.findOne({
      where: {
        id: dto.subject_id,
        organization_id: organizationId,
        is_deleted: false,
      },
    });

    if (!subject) {
      throw new BadRequestException(
        'Invalid subject or subject does not belong to your organization',
      );
    }

    const chapter = await this.chapterRepository.findOne({
      where: {
        id: dto.chapter_id,
        subject_id: dto.subject_id,
        is_deleted: false,
      },
    });

    if (!chapter) {
      throw new BadRequestException(
        'Invalid chapter or chapter does not belong to selected subject',
      );
    }

    const topic = await this.topicRepository.findOne({
      where: {
        id: dto.topic_id,
        chapter_id: dto.chapter_id,
        is_deleted: false,
      },
    });

    if (!topic) {
      throw new BadRequestException(
        'Invalid topic or topic does not belong to selected chapter',
      );
    }

    const correctAnswers = dto.options.filter((option) => option.is_correct);

    if (correctAnswers.length !== 1) {
      throw new BadRequestException(
        'Exactly one option must be marked as correct',
      );
    }

    const optionOrders = dto.options.map((option) => option.option_order);
    const uniqueOrders = new Set(optionOrders);

    if (uniqueOrders.size !== optionOrders.length) {
      throw new BadRequestException('Duplicate option_order is not allowed');
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const question = queryRunner.manager.create(Question, {
        subject_id: dto.subject_id,
        chapter_id: dto.chapter_id,
        topic_id: dto.topic_id,
        status: 'ACTIVE',
        created_by: userId,
      });
      const savedQuestion = await queryRunner.manager.save(Question, question);
      const version = queryRunner.manager.create(QuestionVersion, {
        question_id: savedQuestion.id,
        version_no: 1,
        question_text: dto.question_text,
        explanation: dto.explanation,
        difficulty: dto.difficulty ?? 'MEDIUM',
        status: 'ACTIVE',
        created_by: userId,
      });

      const savedVersion = await queryRunner.manager.save(
        QuestionVersion,
        version,
      );

      const options = dto.options.map((option) =>
        queryRunner.manager.create(QuestionOption, {
          question_version_id: savedVersion.id,
          option_order: option.option_order,
          option_text: option.option_text,
          is_correct: option.is_correct,
        }),
      );

      const savedOptions = await queryRunner.manager.save(
        QuestionOption,
        options,
      );
      await queryRunner.commitTransaction();

      return {
        message: 'Question created successfully',
        question: {
          id: savedQuestion.id,
          subject_id: savedQuestion.subject_id,
          chapter_id: savedQuestion.chapter_id,
          topic_id: savedQuestion.topic_id,
          version: {
            id: savedVersion.id,
            version_no: savedVersion.version_no,
            question_text: savedVersion.question_text,
            explanation: savedVersion.explanation,
            difficulty: savedVersion.difficulty,
            options: savedOptions,
          },
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async findAll(
    organizationId: number,
    subjectId?: number,
    chapterId?: number,
    topicId?: number,
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    difficulty?: string,
  ) {
    const query = this.questionRepository
      .createQueryBuilder('q')
      .innerJoin(Subject, 's', 's.id = q.subject_id')
      .innerJoin(Chapter, 'c', 'c.id = q.chapter_id')
      .innerJoin(Topic, 't', 't.id = q.topic_id')
      .innerJoin(
        QuestionVersion,
        'qv',
        `
      qv.question_id = q.id
      AND qv.status = 'ACTIVE'
      `,
      )
      .where('s.organization_id = :organizationId', { organizationId })
      .andWhere('q.is_deleted = :qDeleted', { qDeleted: false })
      .andWhere('s.is_deleted = :sDeleted', { sDeleted: false })
      .andWhere('c.is_deleted = :cDeleted', { cDeleted: false })
      .andWhere('t.is_deleted = :tDeleted', { tDeleted: false });

    if (subjectId) {
      query.andWhere('q.subject_id = :subjectId', { subjectId });
    }
    if (chapterId) {
      query.andWhere('q.chapter_id = :chapterId', { chapterId });
    }
    if (topicId) {
      query.andWhere('q.topic_id = :topicId', { topicId });
    }
    if (difficulty) {
      query.andWhere('qv.difficulty = :difficulty', { difficulty });
    }

    if (search) {
      query.andWhere(
        `
      (
        qv.question_text LIKE :search
        OR s.name LIKE :search
        OR c.name LIKE :search
        OR t.name LIKE :search
      )
      `,
        {
          search: `%${search}%`,
        },
      );
    }
    const total = await query.getCount();
    const rows = await query
      .select([
        'q.id AS id',
        'q.subject_id AS subject_id',
        'q.chapter_id AS chapter_id',
        'q.topic_id AS topic_id',
        'q.status AS status',
        's.name AS subject_name',
        'c.chapter_no AS chapter_no',
        'c.name AS chapter_name',
        't.topic_no AS topic_no',
        't.name AS topic_name',
        'qv.id AS version_id',
        'qv.version_no AS version_no',
        'qv.question_text AS question_text',
        'qv.difficulty AS difficulty',
      ])

      .orderBy('q.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getRawMany<QuestionListRow>();

    return {
      data: rows,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }
  async findOne(id: number, organizationId: number) {
    const question = await this.questionRepository
      .createQueryBuilder('q')
      .innerJoin(Subject, 's', 's.id = q.subject_id')
      .innerJoin(Chapter, 'c', 'c.id = q.chapter_id')
      .innerJoin(Topic, 't', 't.id = q.topic_id')
      .where('q.id = :id', { id })
      .andWhere('s.organization_id = :organizationId', { organizationId })
      .andWhere('q.is_deleted = :qDeleted', { qDeleted: false })
      .andWhere('s.is_deleted = :sDeleted', { sDeleted: false })
      .andWhere('c.is_deleted = :cDeleted', { cDeleted: false })
      .andWhere('t.is_deleted = :tDeleted', { tDeleted: false })
      .select([
        'q.id AS id',
        'q.subject_id AS subject_id',
        'q.chapter_id AS chapter_id',
        'q.topic_id AS topic_id',
        'q.status AS status',
        's.name AS subject_name',
        'c.chapter_no AS chapter_no',
        'c.name AS chapter_name',
        't.topic_no AS topic_no',
        't.name AS topic_name',
      ])

      .getRawOne<QuestionListRow>();

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const latestVersion = await this.versionRepository.findOne({
      where: {
        question_id: id,
        status: 'ACTIVE',
      },
      order: {
        version_no: 'DESC',
      },
    });

    if (!latestVersion) {
      throw new NotFoundException('Question version not found');
    }

    const options = await this.optionRepository.find({
      where: {
        question_version_id: latestVersion.id,
      },
      order: {
        option_order: 'ASC',
      },
    });

    const result: QuestionDetailItem = {
      ...question,
      version: {
        ...latestVersion,
        options,
      },
    };

    return result;
  }
  async update(
    id: number,
    dto: UpdateQuestionDto,
    userId: number,
    organizationId: number,
  ) {
    const existingQuestion = await this.findOne(id, organizationId);
    const subjectId = dto.subject_id ?? existingQuestion.subject_id;
    const chapterId = dto.chapter_id ?? existingQuestion.chapter_id;
    const topicId = dto.topic_id ?? existingQuestion.topic_id;

    // --------------------------------
    // Validate subject
    // --------------------------------

    const subject = await this.subjectRepository.findOne({
      where: {
        id: subjectId,
        organization_id: organizationId,
        is_deleted: false,
      },
    });

    if (!subject) {
      throw new BadRequestException(
        'Invalid subject or subject does not belong to your organization',
      );
    }

    // --------------------------------
    // Validate chapter
    // --------------------------------

    const chapter = await this.chapterRepository.findOne({
      where: {
        id: chapterId,
        subject_id: subjectId,
        is_deleted: false,
      },
    });

    if (!chapter) {
      throw new BadRequestException(
        'Invalid chapter or chapter does not belong to selected subject',
      );
    }

    // --------------------------------
    // Validate topic
    // --------------------------------

    const topic = await this.topicRepository.findOne({
      where: {
        id: topicId,
        chapter_id: chapterId,
        is_deleted: false,
      },
    });

    if (!topic) {
      throw new BadRequestException(
        'Invalid topic or topic does not belong to selected chapter',
      );
    }

    // --------------------------------
    // Validate correct answer
    // --------------------------------

    const correctAnswers = dto.options.filter((option) => option.is_correct);

    if (correctAnswers.length !== 1) {
      throw new BadRequestException(
        'Exactly one option must be marked as correct',
      );
    }

    // --------------------------------
    // Validate duplicate order
    // --------------------------------

    const optionOrders = dto.options.map((option) => option.option_order);
    const uniqueOrders = new Set(optionOrders);

    if (uniqueOrders.size !== optionOrders.length) {
      throw new BadRequestException('Duplicate option order is not allowed');
    }

    // --------------------------------
    // Find latest version number
    // --------------------------------

    const latestVersion = await this.versionRepository.findOne({
      where: {
        question_id: id,
      },
      order: {
        version_no: 'DESC',
      },
    });

    const nextVersionNo = latestVersion ? latestVersion.version_no + 1 : 1;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // --------------------------------
      // Update question classification
      // --------------------------------

      await queryRunner.manager.update(Question, id, {
        subject_id: subjectId,
        chapter_id: chapterId,
        topic_id: topicId,
        updated_by: userId,
        updated_at: new Date(),
      });

      // --------------------------------
      // Mark previous version inactive
      // --------------------------------

      if (latestVersion) {
        await queryRunner.manager.update(QuestionVersion, latestVersion.id, {
          status: 'INACTIVE',
        });
      }

      // --------------------------------
      // Create new version
      // --------------------------------

      const newVersion = queryRunner.manager.create(QuestionVersion, {
        question_id: id,
        version_no: nextVersionNo,
        question_text: dto.question_text,
        explanation: dto.explanation,
        difficulty: dto.difficulty ?? latestVersion?.difficulty ?? 'MEDIUM',
        status: 'ACTIVE',
        created_by: userId,
      });

      const savedVersion = await queryRunner.manager.save(
        QuestionVersion,
        newVersion,
      );

      // --------------------------------
      // Create options for new version
      // --------------------------------

      const newOptions = dto.options.map((option) =>
        queryRunner.manager.create(QuestionOption, {
          question_version_id: savedVersion.id,
          option_order: option.option_order,
          option_text: option.option_text,
          is_correct: option.is_correct,
        }),
      );

      const savedOptions = await queryRunner.manager.save(
        QuestionOption,
        newOptions,
      );

      await queryRunner.commitTransaction();

      return {
        message: 'Question updated successfully',
        question_id: id,
        version: {
          id: savedVersion.id,
          version_no: savedVersion.version_no,
          question_text: savedVersion.question_text,
          explanation: savedVersion.explanation,
          difficulty: savedVersion.difficulty,
          options: savedOptions,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async getVersions(questionId: number, organizationId: number) {
    await this.findOne(questionId, organizationId);

    const versions = await this.versionRepository.find({
      where: {
        question_id: questionId,
      },
      order: {
        version_no: 'DESC',
      },
    });

    const result: QuestionVersionWithOptions[] = [];

    for (const version of versions) {
      const options = await this.optionRepository.find({
        where: {
          question_version_id: version.id,
        },
        order: {
          option_order: 'ASC',
        },
      });

      result.push({
        ...version,
        options,
      });
    }

    return result;
  }
  async remove(id: number, userId: number, organizationId: number) {
    await this.findOne(id, organizationId);
    await this.questionRepository.update(id, {
      is_deleted: true,
      deleted_by: userId,
      deleted_at: new Date(),
      status: 'INACTIVE',
    });

    return {
      message: 'Question deleted successfully',
    };
  }
  async restore(id: number, userId: number, organizationId: number) {
    const question = await this.questionRepository
      .createQueryBuilder('q')
      .innerJoin(Subject, 's', 's.id = q.subject_id')
      .where('q.id = :id', { id })
      .andWhere('s.organization_id = :organizationId', { organizationId })
      .getOne();
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    await this.questionRepository.update(id, {
      is_deleted: false,
      deleted_by: null,
      deleted_at: null,
      status: 'ACTIVE',
      updated_by: userId,
      updated_at: new Date(),
    });

    return {
      message: 'Question restored successfully',
    };
  }
}
