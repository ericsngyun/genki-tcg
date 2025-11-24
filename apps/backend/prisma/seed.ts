import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Generate a secure random password
function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

async function main() {
  console.log('🌱 Seeding database...');
  console.log('⚠️  WARNING: This script creates test accounts for DEVELOPMENT ONLY');
  console.log('⚠️  DO NOT use these accounts in production environments\n');

  // Create Genki organization
  const genkiOrg = await prisma.organization.upsert({
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

  // Create owner user with secure random password
  const ownerPasswordPlain = generateSecurePassword();
  const ownerPassword = await bcrypt.hash(ownerPasswordPlain, 12);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@genki-tcg.com' },
    update: {},
    create: {
      email: 'owner@genki-tcg.com',
      name: 'Shop Owner',
      passwordHash: ownerPassword,
    },
  });

  await prisma.orgMembership.upsert({
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

  // Create staff user with secure random password
  const staffPasswordPlain = generateSecurePassword();
  const staffPassword = await bcrypt.hash(staffPasswordPlain, 12);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@genki-tcg.com' },
    update: {},
    create: {
      email: 'staff@genki-tcg.com',
      name: 'Staff Member',
      passwordHash: staffPassword,
    },
  });

  await prisma.orgMembership.upsert({
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

  // Create 10 test players with secure random passwords
  const playerCredentials: Array<{ email: string; password: string }> = [];

  for (let i = 1; i <= 10; i++) {
    const playerPasswordPlain = generateSecurePassword();
    const playerPassword = await bcrypt.hash(playerPasswordPlain, 12);
    const player = await prisma.user.upsert({
      where: { email: `player${i}@test.com` },
      update: {},
      create: {
        email: `player${i}@test.com`,
        name: `Player ${i}`,
        passwordHash: playerPassword,
      },
    });

    playerCredentials.push({
      email: `player${i}@test.com`,
      password: playerPasswordPlain,
    });

    await prisma.orgMembership.upsert({
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
    await prisma.creditLedgerEntry.create({
      data: {
        orgId: genkiOrg.id,
        userId: player.id,
        amount: 100, // 100 credits
        reasonCode: 'MANUAL_ADD',
        memo: 'Initial welcome credits',
        createdBy: owner.id,
      },
    });

    await prisma.creditBalance.upsert({
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
  }

  console.log('✅ Created 10 test players with 100 credits each');

  // Create a sample event
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);

  const event = await prisma.event.create({
    data: {
      orgId: genkiOrg.id,
      name: 'Friday Night One Piece TCG',
      game: 'ONE_PIECE_TCG',
      format: 'CONSTRUCTED',
      status: 'SCHEDULED',
      description: 'Weekly Friday night One Piece TCG tournament',
      startAt: tomorrow,
      maxPlayers: 32,
      entryFeeCents: 500, // $5.00
      requiresDecklist: false,
      allowLateRegistration: true,
      createdBy: owner.id,
    },
  });

  console.log('✅ Created sample event:', event.name);

  console.log('\n🎉 Seeding complete!');
  console.log('\n' + '='.repeat(80));
  console.log('📝 TEST CREDENTIALS (Development Only - Store Securely)');
  console.log('='.repeat(80));
  console.log(`\nOwner Account:\n  Email: owner@genki-tcg.com\n  Password: ${ownerPasswordPlain}`);
  console.log(`\nStaff Account:\n  Email: staff@genki-tcg.com\n  Password: ${staffPasswordPlain}`);
  console.log('\nPlayer Accounts:');
  playerCredentials.forEach((cred, idx) => {
    console.log(`  ${idx + 1}. ${cred.email} / ${cred.password}`);
  });
  console.log(`\nOrganization Invite Code: GENKI`);
  console.log('\n' + '='.repeat(80));
  console.log('⚠️  SAVE THESE CREDENTIALS - They cannot be recovered!');
  console.log('⚠️  For production, use password reset flow to set secure passwords');
  console.log('='.repeat(80) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
