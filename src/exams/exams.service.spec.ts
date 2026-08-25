import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Question } from '../questions/entities/question.entity';
import { QuestionVersion } from '../questions/entities/question-version.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { ExamQuestion } from './entities/exam-question.entity';
import { Exam } from './entities/exam.entity';
import { ExamsService } from './exams.service';

describe('ExamsService', () => {
  let service: ExamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        {
          provide: getRepositoryToken(Exam),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ExamQuestion),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(QuestionVersion),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Question),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Subject),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
