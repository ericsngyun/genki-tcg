import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMatchResults() {
    console.log('🔧 Fixing match results for dropped players...\n');

    // Find the AZUKI UNCUT SHEET TOURNAMENT
    const event = await prisma.event.findFirst({
        where: {
            name: { contains: 'AZUKI UNCUT SHEET' },
            status: 'IN_PROGRESS',
        },
        include: {
            rounds: {
                include: {
                    matches: {
                        include: {
                            playerA: { select: { id: true, name: true } },
                            playerB: { select: { id: true, name: true } },
                        },
                    },
                },
                orderBy: { roundNumber: 'asc' },
            },
            entries: {
                include: {
                    user: { select: { id: true, name: true } },
                },
            },
        },
    });

    if (!event) {
        console.log('❌ Could not find AZUKI UNCUT SHEET TOURNAMENT');
        return;
    }

    console.log(`📋 Found event: ${event.name}`);
    console.log(`   Rounds: ${event.rounds.length}`);
    console.log(`   Players: ${event.entries.length}\n`);

    // Find users by name
    const findUser = (name: string) => event.entries.find(e =>
        e.user.name.toLowerCase().includes(name.toLowerCase())
    )?.user;

    const forgotten = findUser('Forgotten');
    const justin = findUser('Justin');
    const cat = findUser('CAT');
    const miguelito = findUser('Miguelito');

    console.log('👤 Found users:');
    console.log(`   Forgotten: ${forgotten?.id || 'NOT FOUND'}`);
    console.log(`   Justin: ${justin?.id || 'NOT FOUND'}`);
    console.log(`   CAT: ${cat?.id || 'NOT FOUND'}`);
    console.log(`   Miguelito: ${miguelito?.id || 'NOT FOUND'}\n`);

    // Print current match results for these players
    console.log('📊 Current match results:\n');

    for (const round of event.rounds) {
        console.log(`Round ${round.roundNumber}:`);
        for (const match of round.matches) {
            const playerAName = match.playerA?.name || 'BYE';
            const playerBName = match.playerB?.name || 'BYE';

            // Check if any of our problem players are in this match
            const hasDroppedPlayer = [forgotten?.id, justin?.id, cat?.id, miguelito?.id]
                .filter(Boolean)
                .some(id => match.playerAId === id || match.playerBId === id);

            if (hasDroppedPlayer) {
                console.log(`  Match ${match.id.slice(-8)}:`);
                console.log(`    ${playerAName} vs ${playerBName}`);
                console.log(`    Result: ${match.result} (${match.gamesWonA}-${match.gamesWonB})`);
            }
        }
    }
}

fixMatchResults()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
