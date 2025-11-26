import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameType, SeasonStatus } from '@prisma/client';
import { GLICKO2_DEFAULTS } from './types/rating.types';

@Injectable()
export class SeasonsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get the currently active season for an organization
     * Only one season should be ACTIVE at a time per org
     */
    async getActiveSeason(orgId: string) {
        const season = await this.prisma.season.findFirst({
            where: {
                orgId,
                status: SeasonStatus.ACTIVE,
            },
            orderBy: {
                startDate: 'desc',
            },
        });

        return season;
    }

    /**
     * Create a new season for an organization
     * Admin action
     */
    async createSeason(params: {
        orgId: string;
        name: string;
        startDate: Date;
        endDate: Date;
        autoActivate?: boolean;
    }) {
        const { orgId, name, startDate, endDate, autoActivate = false } = params;

        // Validate dates
        if (endDate <= startDate) {
            throw new BadRequestException('End date must be after start date');
        }

        // Check for overlapping seasons
        const overlapping = await this.prisma.season.findFirst({
            where: {
                orgId,
                OR: [
                    // New season starts during existing season
                    {
                        AND: [
                            { startDate: { lte: startDate } },
                            { endDate: { gte: startDate } },
                        ],
                    },
                    // New season ends during existing season
                    {
                        AND: [
                            { startDate: { lte: endDate } },
                            { endDate: { gte: endDate } },
                        ],
                    },
                    // New season completely encompasses existing season
                    {
                        AND: [
                            { startDate: { gte: startDate } },
                            { endDate: { lte: endDate } },
                        ],
                    },
                ],
            },
        });

        if (overlapping) {
            throw new BadRequestException(
                `Season overlaps with existing season: ${overlapping.name}`
            );
        }

        // Determine initial status
        const now = new Date();
        let status: SeasonStatus;
        if (autoActivate && startDate <= now && endDate >= now) {
            status = SeasonStatus.ACTIVE;
        } else if (startDate > now) {
            status = SeasonStatus.UPCOMING;
        } else if (endDate < now) {
            status = SeasonStatus.COMPLETED;
        } else {
            status = SeasonStatus.UPCOMING;
        }

        // Create season
        const season = await this.prisma.season.create({
            data: {
                orgId,
                name,
                startDate,
                endDate,
                status,
            },
        });

        return season;
    }

    /**
     * Initialize seasonal ratings for all players in a season
     * Called at the start of a new season
     * For each player with a lifetime rating in each category:
     * - Copy lifetime rating → seasonal rating
     * - Reset seasonal stats to 0
     */
    async initializeSeasonRatingsForAllPlayers(seasonId: string) {
        const season = await this.prisma.season.findUnique({
            where: { id: seasonId },
        });

        if (!season) {
            throw new NotFoundException('Season not found');
        }

        // Get all lifetime ratings for this org
        const lifetimeRatings = await this.prisma.playerCategoryLifetimeRating.findMany({
            where: {
                orgId: season.orgId,
            },
        });

        // Create seasonal ratings for each lifetime rating
        const seasonalRatings = await Promise.all(
            lifetimeRatings.map((lifetime) =>
                this.prisma.playerCategorySeasonRating.upsert({
                    where: {
                        userId_orgId_seasonId_category: {
                            userId: lifetime.userId,
                            orgId: lifetime.orgId,
                            seasonId: season.id,
                            category: lifetime.category,
                        },
                    },
                    update: {
                        // Reset to lifetime rating values
                        rating: lifetime.rating,
                        ratingDeviation: lifetime.ratingDeviation,
                        volatility: lifetime.volatility,
                        // Reset stats
                        totalRatedMatches: 0,
                        matchWins: 0,
                        matchLosses: 0,
                        matchDraws: 0,
                    },
                    create: {
                        userId: lifetime.userId,
                        orgId: lifetime.orgId,
                        seasonId: season.id,
                        category: lifetime.category,
                        // Initialize from lifetime rating
                        rating: lifetime.rating,
                        ratingDeviation: lifetime.ratingDeviation,
                        volatility: lifetime.volatility,
                        // Start with 0 stats
                        totalRatedMatches: 0,
                        matchWins: 0,
                        matchLosses: 0,
                        matchDraws: 0,
                    },
                })
            )
        );

        return {
            seasonId: season.id,
            seasonName: season.name,
            playersInitialized: seasonalRatings.length,
        };
    }

    /**
     * Automatically assign events to seasons based on their start date
     * Helper method to backfill or update event-season assignments
     */
    async assignEventsToSeasons(orgId: string) {
        const seasons = await this.prisma.season.findMany({
            where: { orgId },
            orderBy: { startDate: 'asc' },
        });

        if (seasons.length === 0) {
            return { eventsAssigned: 0 };
        }

        let eventsAssigned = 0;

        for (const season of seasons) {
            const result = await this.prisma.event.updateMany({
                where: {
                    orgId,
                    startAt: {
                        gte: season.startDate,
                        lte: season.endDate,
                    },
                    seasonId: null, // Only assign if not already assigned
                },
                data: {
                    seasonId: season.id,
                },
            });

            eventsAssigned += result.count;
        }

        return { eventsAssigned };
    }

    /**
     * Get all seasons for an organization
     */
    async getSeasons(orgId: string, status?: SeasonStatus) {
        return this.prisma.season.findMany({
            where: {
                orgId,
                ...(status && { status }),
            },
            orderBy: {
                startDate: 'desc',
            },
            include: {
                _count: {
                    select: {
                        events: true,
                        seasonalRatings: true,
                    },
                },
            },
        });
    }

    /**
     * Get a specific season by ID
     */
    async getSeason(seasonId: string) {
        const season = await this.prisma.season.findUnique({
            where: { id: seasonId },
            include: {
                _count: {
                    select: {
                        events: true,
                        seasonalRatings: true,
                        tournamentRatingUpdates: true,
                    },
                },
            },
        });

        if (!season) {
            throw new NotFoundException('Season not found');
        }

        return season;
    }

    /**
     * Update season status (e.g., UPCOMING → ACTIVE → COMPLETED)
     * Admin action
     */
    async updateSeasonStatus(seasonId: string, status: SeasonStatus) {
        const season = await this.prisma.season.update({
            where: { id: seasonId },
            data: { status },
        });

        return season;
    }
}
