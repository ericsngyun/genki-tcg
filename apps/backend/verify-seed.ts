import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    console.log('🔍 Verifying seeded data...');

    // 1. Check Active Season
    const activeSeason = await prisma.season.findFirst({
        where: { status: 'ACTIVE' },
    });

    if (activeSeason) {
        console.log(`✅ Active Season found: ${activeSeason.name} (${activeSeason.id})`);
    } else {
        console.error('❌ No ACTIVE season found!');
    }

    // 2. Check Player Ratings
    const lifetimeCount = await prisma.playerCategoryLifetimeRating.count();
    const seasonalCount = await prisma.playerCategorySeasonRating.count();

    console.log(`📊 Lifetime Ratings: ${lifetimeCount}`);
    console.log(`📊 Seasonal Ratings: ${seasonalCount}`);

    if (lifetimeCount > 0 && seasonalCount > 0) {
        console.log('✅ Ratings exist');
    } else {
        console.error('❌ Ratings missing');
    }

    // 3. Check specific player (Player 1)
    const player1 = await prisma.user.findFirst({ where: { email: 'player1@test.com' } });
    if (player1) {
        const p1Ratings = await prisma.playerCategoryLifetimeRating.findMany({
            where: { userId: player1.id }
        });
        console.log(`👤 Player 1 has ${p1Ratings.length} lifetime ratings`);
        p1Ratings.forEach(r => console.log(`   - ${r.category}: ${Math.round(r.rating)}`));
    }

    await prisma.$disconnect();
}

verify().catch(console.error);
