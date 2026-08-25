import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from './entities/topic.entity';
import { Chapter } from '../chapters/entities/chapter.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  async create(dto: CreateTopicDto, userId: number, organizationId: number) {
    const chapter = await this.chapterRepository.findOne({
      where: {
        id: dto.chapter_id,
        is_deleted: false,
      },
    });

    if (!chapter) {
      throw new BadRequestException('Invalid chapter');
    }

    const subject = await this.subjectRepository.findOne({
      where: {
        id: chapter.subject_id,
        organization_id: organizationId,
        is_deleted: false,
      },
    });

    if (!subject) {
      throw new BadRequestException(
        'Chapter does not belong to your organization',
      );
    }

    const existingTopic = await this.topicRepository.findOne({
      where: {
        chapter_id: dto.chapter_id,
        topic_no: dto.topic_no,
        is_deleted: false,
      },
    });

    if (existingTopic) {
      throw new BadRequestException(
        'Topic number already exists for this chapter',
      );
    }

    const topic = this.topicRepository.create({
      ...dto,

      status: 'ACTIVE',

      created_by: userId,
    });

    return await this.topicRepository.save(topic);
  }

  async findAll(organizationId: number, chapterId?: number) {
    const query = this.topicRepository
      .createQueryBuilder('topic')

      .innerJoin(Chapter, 'chapter', 'chapter.id = topic.chapter_id')
      .innerJoin(Subject, 'subject', 'subject.id = chapter.subject_id')

      .where('subject.organization_id = :organizationId', { organizationId })

      .andWhere('subject.is_deleted = :subjectDeleted', {
        subjectDeleted: false,
      })

      .andWhere('chapter.is_deleted = :chapterDeleted', {
        chapterDeleted: false,
      })

      .andWhere('topic.is_deleted = :topicDeleted', { topicDeleted: false });

    if (chapterId) {
      query.andWhere('topic.chapter_id = :chapterId', { chapterId });
    }

    return await query
      .orderBy('topic.chapter_id', 'ASC')
      .addOrderBy('topic.topic_no', 'ASC')
      .getMany();
  }

  async findOne(id: number, organizationId: number) {
    const topic = await this.topicRepository
      .createQueryBuilder('topic')
      .innerJoin(Chapter, 'chapter', 'chapter.id = topic.chapter_id')
      .innerJoin(Subject, 'subject', 'subject.id = chapter.subject_id')
      .where('topic.id = :id', { id })
      .andWhere('topic.is_deleted = :topicDeleted', { topicDeleted: false })
      .andWhere('chapter.is_deleted = :chapterDeleted', {
        chapterDeleted: false,
      })

      .andWhere('subject.is_deleted = :subjectDeleted', {
        subjectDeleted: false,
      })
      .andWhere('subject.organization_id = :organizationId', { organizationId })
      .getOne();

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return topic;
  }

  async update(
    id: number,
    dto: UpdateTopicDto,
    userId: number,
    organizationId: number,
  ) {
    const currentTopic = await this.findOne(id, organizationId);

    const targetChapterId = dto.chapter_id ?? currentTopic.chapter_id;

    const chapter = await this.chapterRepository.findOne({
      where: {
        id: targetChapterId,
        is_deleted: false,
      },
    });

    if (!chapter) {
      throw new BadRequestException('Invalid chapter');
    }

    const subject = await this.subjectRepository.findOne({
      where: {
        id: chapter.subject_id,
        organization_id: organizationId,
        is_deleted: false,
      },
    });

    if (!subject) {
      throw new BadRequestException(
        'Chapter does not belong to your organization',
      );
    }

    const targetTopicNo = dto.topic_no ?? currentTopic.topic_no;

    const duplicate = await this.topicRepository
      .createQueryBuilder('topic')
      .where('topic.chapter_id = :chapterId', {
        chapterId: targetChapterId,
      })

      .andWhere('topic.topic_no = :topicNo', {
        topicNo: targetTopicNo,
      })
      .andWhere('topic.id <> :id', { id })
      .andWhere('topic.is_deleted = :isDeleted', {
        isDeleted: false,
      })

      .getOne();

    if (duplicate) {
      throw new BadRequestException(
        'Topic number already exists for this chapter',
      );
    }

    await this.topicRepository.update(id, {
      ...dto,
      updated_by: userId,
      updated_at: new Date(),
    });

    return this.findOne(id, organizationId);
  }

  async remove(id: number, userId: number, organizationId: number) {
    await this.findOne(id, organizationId);

    await this.topicRepository.update(id, {
      is_deleted: true,
      deleted_by: userId,
      deleted_at: new Date(),
    });

    return {
      message: 'Topic deleted successfully',
    };
  }
}
