import { Test, TestingModule } from '@nestjs/testing';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { SeasonsService } from './seasons.service';

describe('RatingsController', () => {
  let controller: RatingsController;
  let ratingsService: RatingsService;
  let seasonsService: SeasonsService;

  const mockRatingsService = {
    processTournamentRatings: jest.fn().mockResolvedValue(undefined),
    getPlayerRanks: jest.fn().mockResolvedValue([]),
    getLifetimeLeaderboard: jest.fn().mockResolvedValue([]),
    getSeasonalLeaderboard: jest.fn().mockResolvedValue([]),
    getPlayerRatingHistory: jest.fn().mockResolvedValue([]),
  };

  const mockSeasonsService = {
    getCurrentSeasonForCategory: jest.fn().mockResolvedValue(null),
    createSeason: jest.fn().mockResolvedValue(undefined),
    endSeason: jest.fn().mockResolvedValue(undefined),
    getAllSeasons: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatingsController],
      providers: [
        {
          provide: RatingsService,
          useValue: mockRatingsService,
        },
        {
          provide: SeasonsService,
          useValue: mockSeasonsService,
        },
      ],
    }).compile();

    controller = module.get<RatingsController>(RatingsController);
    ratingsService = module.get<RatingsService>(RatingsService);
    seasonsService = module.get<SeasonsService>(SeasonsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
