import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrgsService {
  constructor(private prisma: PrismaService) { }

  async getOrg(orgId: string) {
    return this.prisma.organization.findUnique({
      where: { id: orgId },
    });
  }

  async getOrgUsers(orgId: string, search?: string) {
    return this.prisma.user.findMany({
      where: {
        memberships: {
          some: {
            orgId,
          },
        },
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        memberships: {
          where: { orgId },
        },
        lifetimeRatings: {
          where: { orgId },
          select: {
            rating: true,
            category: true,
          },
        },
      },
      take: 50,
    });
  }
}
