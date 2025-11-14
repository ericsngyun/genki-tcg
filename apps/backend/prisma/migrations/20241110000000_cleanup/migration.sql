-- Cleanup failed migration state
-- This migration removes the failed migration record from Prisma's tracking table
-- so we can apply fresh migrations

-- Delete the failed migration record
DELETE FROM "_prisma_migrations"
WHERE "migration_name" = '20241112000000_update_game_types';

-- Also clean up any other failed migrations
DELETE FROM "_prisma_migrations"
WHERE "migration_name" IN (
  '20241112000001_add_prize_distribution',
  '20241113000000_add_payment_tracking'
);

-- Note: This is safe because these migrations never completed successfully
-- The tables they tried to modify don't exist yet
