// Utility functions for formatting display values

export function formatGameName(gameType: string): string {
  const gameNames: Record<string, string> = {
    // Current database values
    ONE_PIECE_TCG: 'One Piece TCG',
    AZUKI_TCG: 'Azuki TCG',
    RIFTBOUND: 'Riftbound',
    // Legacy/alternative values
    OPTCG: 'One Piece TCG',
    AZUKI: 'Azuki TCG',
    ONEPIECE: 'One Piece TCG',
    UNIONARENA: 'Union Arena',
    DIGIMON: 'Digimon',
    OTHER: 'Other',
  };

  return gameNames[gameType] || gameType;
}

export function formatEventFormat(format: string): string {
  const formats: Record<string, string> = {
    STANDARD: 'Standard',
    DRAFT: 'Draft',
    SEALED: 'Sealed',
    CONSTRUCTED: 'Constructed',
    SUPER_PRE_RELEASE: 'Super Pre-Release',
    PRE_RELEASE: 'Pre-Release',
  };

  return formats[format] || format;
}

export function formatEventStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

/**
 * Get the game image path based on game type
 */
export function getGameImagePath(gameType: string): string {
  const gameImages: Record<string, string> = {
    ONE_PIECE_TCG: '/optcg.jpg',
    AZUKI_TCG: '/azukitcg.jpg',
    RIFTBOUND: '/riftboundtcg.jpg',
    // Fallback to One Piece if unknown
    OPTCG: '/optcg.jpg',
    AZUKI: '/azukitcg.jpg',
  };

  return gameImages[gameType] || gameImages.ONE_PIECE_TCG;
}