import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChaptersService } from './chapters.service';
import { Chapter } from './entities/chapter.entity';
import { Subject } from '../subjects/entities/subject.entity';

describe('ChaptersService', () => {
  let service: ChaptersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChaptersService,
        {
          provide: getRepositoryToken(Chapter),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
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

    service = module.get<ChaptersService>(ChaptersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
