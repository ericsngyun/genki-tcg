import { Test, TestingModule } from '@nestjs/testing';
import { RatingsService } from './ratings.service';
import { PrismaService } from '../prisma/prisma.service';
import { SeasonsService } from './seasons.service';

describe('RatingsService', () => {
  let service: RatingsService;
  let prisma: PrismaService;
  let seasonsService: SeasonsService;

  const mockPrismaService: any = {
    playerCategoryLifetimeRating: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    playerCategorySeasonRating: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    lifetimeRatingHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => callback(mockPrismaService)),
  };

  const mockSeasonsService = {
    getCurrentSeasonForCategory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SeasonsService,
          useValue: mockSeasonsService,
        },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
    prisma = module.get<PrismaService>(PrismaService);
    seasonsService = module.get<SeasonsService>(SeasonsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
