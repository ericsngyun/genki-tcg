import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogDto } from './dto';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(dto: AuditLogDto) {
    return this.prisma.auditLog.create({
      data: dto,
    });
  }

  async getOrgLogs(orgId: string, limit: number = 100) {
    return this.prisma.auditLog.findMany({
      where: { orgId },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
