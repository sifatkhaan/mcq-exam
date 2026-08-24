import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from './entities/chapter.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,

    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  async create(dto: CreateChapterDto, userId: number, organizationId: number) {
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

    const existingChapter = await this.chapterRepository.findOne({
      where: {
        subject_id: dto.subject_id,
        chapter_no: dto.chapter_no,
        is_deleted: false,
      },
    });
    if (existingChapter) {
      throw new BadRequestException(
        'Chapter number already exists for this subject',
      );
    }
    const chapter = this.chapterRepository.create({
      ...dto,
      status: 'ACTIVE',
      created_by: userId,
    });
    return await this.chapterRepository.save(chapter);
  }

  async findAll(organizationId: number, subjectId?: number) {
    const query = this.chapterRepository
      .createQueryBuilder('chapter')
      .innerJoin(Subject, 'subject', 'subject.id = chapter.subject_id')
      .where('subject.organization_id = :organizationId', { organizationId })
      .andWhere('subject.is_deleted = :subjectDeleted', {
        subjectDeleted: false,
      })
      .andWhere('chapter.is_deleted = :chapterDeleted', {
        chapterDeleted: false,
      });

    if (subjectId) {
      query.andWhere('chapter.subject_id = :subjectId', { subjectId });
    }
    return await query
      .orderBy('chapter.chapter_no', 'ASC')
      .addOrderBy('chapter.chapter_no', 'ASC')
      .getMany();
  }

  async findOne(id: number, organizationId: number) {
    const chapter = await this.chapterRepository
      .createQueryBuilder('chapter')
      .innerJoin(Subject, 'subject', 'subject.id = chapter.subject_id')
      .where('chapter.id = :id', { id })
      .andWhere('chapter.is_deleted = :chapterDeleted', {
        chapterDeleted: false,
      })
      .andWhere('subject.organization_id = :organizationId', { organizationId })
      .andWhere('subject.is_deleted = :subjectDeleted', {
        subjectDeleted: false,
      })
      .getOne();

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    return chapter;
  }

  async update(
    id: number,
    dto: UpdateChapterDto,
    userId: number,
    organizationId: number,
  ) {
    const currentChapter = await this.findOne(id, organizationId);
    const targetSubjectId = dto.subject_id ?? currentChapter.subject_id;
    const subject = await this.subjectRepository.findOne({
      where: {
        id: targetSubjectId,
        organization_id: organizationId,
        is_deleted: false,
      },
    });

    if (!subject) {
      throw new BadRequestException(
        'Invalid subject or subject does not belong to your organization',
      );
    }
    const targetChapterNo = dto.chapter_no ?? currentChapter.chapter_no;
    const duplicate = await this.chapterRepository
      .createQueryBuilder('chapter')
      .where('chapter.subject_id = :subjectId', {
        subjectId: targetSubjectId,
      })
      .andWhere('chapter.chapter_no = :chapterNo', {
        chapterNo: targetChapterNo,
      })
      .andWhere('chapter.id <> :id', { id })
      .andWhere('chapter.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .getOne();

    if (duplicate) {
      throw new BadRequestException(
        'Chapter number already exists for this subject',
      );
    }
    await this.chapterRepository.update(id, {
      ...dto,
      updated_by: userId,
      updated_at: new Date(),
    });
    return this.findOne(id, organizationId);
  }

  async remove(id: number, userId: number, organizationId: number) {
    await this.findOne(id, organizationId);
    await this.chapterRepository.update(id, {
      is_deleted: true,
      deleted_by: userId,
      deleted_at: new Date(),
    });
    return {
      message: 'Chapter deleted successfully',
    };
  }
}
