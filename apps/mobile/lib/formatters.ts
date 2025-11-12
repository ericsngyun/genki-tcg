// Utility functions for formatting display values

export function formatGameName(gameType: string): string {
  const gameNames: Record<string, string> = {
    ONE_PIECE_TCG: 'One Piece TCG',
    AZUKI_TCG: 'Azuki TCG',
    RIFTBOUND: 'Riftbound',
    // Legacy support (in case any old data exists)
    OPTCG: 'One Piece TCG',
    ONEPIECE: 'One Piece TCG',
    UNIONARENA: 'Union Arena',
    DIGIMON: 'Digimon',
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
