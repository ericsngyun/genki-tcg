import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(private prisma: PrismaService) {}

  async seed() {
    console.log('🌱 Seeding database...');

    // Create Genki organization
    const genkiOrg = await this.prisma.organization.upsert({
      where: { slug: 'genki' },
      update: {},
      create: {
        name: 'Genki TCG',
        slug: 'genki',
        inviteCode: 'GENKI',
        logoUrl: null,
        primaryColor: '#4F46E5',
        secondaryColor: '#10B981',
      },
    });

    console.log('✅ Created organization:', genkiOrg.name);

    // Create owner user
    const ownerPassword = await bcrypt.hash('password123', 12);
    const owner = await this.prisma.user.upsert({
      where: { email: 'owner@genki-tcg.com' },
      update: {},
      create: {
        email: 'owner@genki-tcg.com',
        name: 'Shop Owner',
        passwordHash: ownerPassword,
      },
    });

    await this.prisma.orgMembership.upsert({
      where: {
        userId_orgId: {
          userId: owner.id,
          orgId: genkiOrg.id,
        },
      },
      update: {},
      create: {
        userId: owner.id,
        orgId: genkiOrg.id,
        role: 'OWNER',
      },
    });

    console.log('✅ Created owner:', owner.email);

    // Create staff user
    const staffPassword = await bcrypt.hash('password123', 12);
    const staff = await this.prisma.user.upsert({
      where: { email: 'staff@genki-tcg.com' },
      update: {},
      create: {
        email: 'staff@genki-tcg.com',
        name: 'Staff Member',
        passwordHash: staffPassword,
      },
    });

    await this.prisma.orgMembership.upsert({
      where: {
        userId_orgId: {
          userId: staff.id,
          orgId: genkiOrg.id,
        },
      },
      update: {},
      create: {
        userId: staff.id,
        orgId: genkiOrg.id,
        role: 'STAFF',
      },
    });

    console.log('✅ Created staff:', staff.email);

    // Create 10 test players
    const players = [];
    for (let i = 1; i <= 10; i++) {
      const playerPassword = await bcrypt.hash('password123', 12);
      const player = await this.prisma.user.upsert({
        where: { email: `player${i}@test.com` },
        update: {},
        create: {
          email: `player${i}@test.com`,
          name: `Player ${i}`,
          passwordHash: playerPassword,
        },
      });

      await this.prisma.orgMembership.upsert({
        where: {
          userId_orgId: {
            userId: player.id,
            orgId: genkiOrg.id,
          },
        },
        update: {},
        create: {
          userId: player.id,
          orgId: genkiOrg.id,
          role: 'PLAYER',
        },
      });

      // Give each player some initial credits
      await this.prisma.creditLedgerEntry.create({
        data: {
          orgId: genkiOrg.id,
          userId: player.id,
          amount: 100,
          reasonCode: 'MANUAL_ADD',
          memo: 'Initial welcome credits',
          createdBy: owner.id,
        },
      });

      await this.prisma.creditBalance.upsert({
        where: {
          orgId_userId: {
            orgId: genkiOrg.id,
            userId: player.id,
          },
        },
        update: {
          balance: 100,
          lastTransactionAt: new Date(),
        },
        create: {
          orgId: genkiOrg.id,
          userId: player.id,
          balance: 100,
          lastTransactionAt: new Date(),
        },
      });

      players.push(player);
    }

    console.log('✅ Created 10 test players with 100 credits each');

    // Create a sample event
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);

    const event = await this.prisma.event.create({
      data: {
        orgId: genkiOrg.id,
        name: 'Friday Night One Piece TCG',
        game: 'ONE_PIECE_TCG',
        format: 'CONSTRUCTED',
        status: 'SCHEDULED',
        description: 'Weekly Friday night One Piece TCG tournament',
        startAt: tomorrow,
        maxPlayers: 32,
        entryFeeCents: 500,
        requiresDecklist: false,
        allowLateRegistration: true,
        createdBy: owner.id,
      },
    });

    console.log('✅ Created sample event:', event.name);

    console.log('🎉 Seeding complete!');

    return {
      organization: genkiOrg.name,
      owner: owner.email,
      staff: staff.email,
      players: players.length,
      event: event.name,
      credentials: {
        owner: 'owner@genki-tcg.com / password123',
        staff: 'staff@genki-tcg.com / password123',
        players: 'player1@test.com ... player10@test.com / password123',
        inviteCode: 'GENKI',
      },
    };
  }
}
