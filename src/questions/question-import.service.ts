import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import type { CellValue, Row } from 'exceljs';
import type {} from 'multer';
import { Question } from './entities/question.entity';
import { QuestionVersion } from './entities/question-version.entity';
import { QuestionOption } from './entities/question-option.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Chapter } from '../chapters/entities/chapter.entity';
import { Topic } from '../topics/entities/topic.entity';

type ImportedQuestionRow = {
  subject_code: string;
  chapter_no: number;
  topic_name: string;
  question_text: string;
  explanation?: string;
  difficulty?: string;
  options: string[];
  correct_option: string;
};

type ImportQuestionError = {
  row: number;
  error: string;
};

type OptionLetter = 'A' | 'B' | 'C' | 'D' | 'E';

type ExcelWorkbookBuffer = Parameters<ExcelJS.Xlsx['load']>[0];

type UploadedExcelFile = Express.Multer.File;

@Injectable()
export class QuestionImportService {
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

  async importExcel(
    file: UploadedExcelFile,
    userId: number,
    organizationId: number,
  ) {
    const workbook = new ExcelJS.Workbook();

    const workbookBuffer = file.buffer.buffer.slice(
      file.buffer.byteOffset,
      file.buffer.byteOffset + file.buffer.byteLength,
    ) as ExcelWorkbookBuffer;

    await workbook.xlsx.load(workbookBuffer);

    const worksheet = workbook.worksheets[0];

    const errors: ImportQuestionError[] = [];

    let imported = 0;

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      try {
        const row = worksheet.getRow(rowNumber);

        const data = this.readRow(row);

        await this.saveQuestion(data, userId, organizationId);

        imported++;
      } catch (error: unknown) {
        errors.push({
          row: rowNumber,

          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      total_rows: worksheet.rowCount - 1,

      imported,

      failed: errors.length,

      errors,
    };
  }

  private readRow(row: Row): ImportedQuestionRow {
    return {
      subject_code: this.getCellText(row, 1),

      chapter_no: Number(this.getCellText(row, 2)),

      topic_name: this.getCellText(row, 3),

      question_text: this.getCellText(row, 4),

      explanation: this.getCellText(row, 5) || undefined,

      difficulty: this.getCellText(row, 6) || undefined,

      options: [
        this.getCellText(row, 7),
        this.getCellText(row, 8),
        this.getCellText(row, 9),
        this.getCellText(row, 10),
        this.getCellText(row, 11),
      ].filter((value) => value !== ''),

      correct_option: this.getCellText(row, 12).toUpperCase(),
    };
  }

  private getCellText(row: Row, cellNumber: number): string {
    return this.formatCellValue(row.getCell(cellNumber).value);
  }

  private formatCellValue(value: CellValue): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return String(value).trim();
    }

    if (Array.isArray(value)) {
      return value
        .map((item: CellValue) => this.formatCellValue(item))
        .join('')
        .trim();
    }

    if ('text' in value) {
      return value.text.trim();
    }

    if ('result' in value) {
      return this.formatCellValue(value.result);
    }

    if ('richText' in value) {
      return value.richText
        .map((item) => item.text)
        .join('')
        .trim();
    }

    if ('hyperlink' in value && typeof value.hyperlink === 'string') {
      return value.hyperlink.trim();
    }

    return '';
  }

  private validateRow(data: ImportedQuestionRow): void {
    if (!data.subject_code) {
      throw new BadRequestException('Subject code missing');
    }

    if (!data.question_text) {
      throw new BadRequestException('Question text missing');
    }

    if (data.options.length < 2) {
      throw new BadRequestException('At least two options required');
    }

    const correctIndex = this.optionLetterToIndex(data.correct_option);

    if (correctIndex < 0 || correctIndex >= data.options.length) {
      throw new BadRequestException('Invalid correct option');
    }
  }

  private optionLetterToIndex(option: string): number {
    const map: Record<OptionLetter, number> = {
      A: 0,

      B: 1,

      C: 2,

      D: 3,

      E: 4,
    };

    if (!this.isOptionLetter(option)) {
      return -1;
    }

    return map[option];
  }

  private isOptionLetter(option: string): option is OptionLetter {
    return ['A', 'B', 'C', 'D', 'E'].includes(option);
  }

  private async saveQuestion(
    data: ImportedQuestionRow,
    userId: number,
    organizationId: number,
  ): Promise<void> {
    this.validateRow(data);

    const subject = await this.subjectRepository.findOne({
      where: {
        code: data.subject_code,
        organization_id: organizationId,
        is_deleted: false,
      },
    });

    if (!subject) {
      throw new Error(`Subject not found ${data.subject_code}`);
    }

    const chapter = await this.chapterRepository.findOne({
      where: {
        subject_id: subject.id,

        chapter_no: data.chapter_no,
        is_deleted: false,
      },
    });

    if (!chapter) {
      throw new Error(`Chapter not found`);
    }

    const topic = await this.topicRepository.findOne({
      where: {
        chapter_id: chapter.id,

        name: data.topic_name,
        is_deleted: false,
      },
    });

    if (!topic) {
      throw new Error(`Topic not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      const question = queryRunner.manager.create(Question, {
        subject_id: subject.id,

        chapter_id: chapter.id,

        topic_id: topic.id,

        created_by: userId,
      });

      const savedQuestion = await queryRunner.manager.save(Question, question);

      const version = queryRunner.manager.create(QuestionVersion, {
        question_id: savedQuestion.id,

        version_no: 1,

        question_text: data.question_text,

        explanation: data.explanation,

        difficulty: data.difficulty ?? 'MEDIUM',

        created_by: userId,
      });

      const savedVersion = await queryRunner.manager.save(
        QuestionVersion,
        version,
      );

      const correctIndex = this.optionLetterToIndex(data.correct_option);

      const options = data.options.map((text: string, index: number) => {
        return queryRunner.manager.create(QuestionOption, {
          question_version_id: savedVersion.id,

          option_text: text,

          option_order: index + 1,

          is_correct: index === correctIndex,
        });
      });

      await queryRunner.manager.save(QuestionOption, options);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
