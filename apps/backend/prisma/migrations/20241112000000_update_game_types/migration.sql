-- AlterEnum: Update GameType enum to support One Piece TCG, Azuki TCG, and Riftbound
-- This migration updates existing values and adds new ones

-- First, update any existing data to use new enum values
UPDATE "Event" SET game = 'ONE_PIECE_TCG' WHERE game IN ('OPTCG', 'ONEPIECE');

-- Drop and recreate the enum with new values
ALTER TYPE "GameType" RENAME TO "GameType_old";

CREATE TYPE "GameType" AS ENUM ('ONE_PIECE_TCG', 'AZUKI_TCG', 'RIFTBOUND');

-- Update the Event table to use the new enum
ALTER TABLE "Event"
  ALTER COLUMN "game" TYPE "GameType"
  USING (game::text::"GameType");

-- Drop the old enum
DROP TYPE "GameType_old";
