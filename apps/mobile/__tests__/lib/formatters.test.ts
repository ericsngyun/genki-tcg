import { formatGameName, formatEventFormat } from '../../lib/formatters';

describe('Formatters', () => {
  describe('formatGameName', () => {
    it('should format ONE_PIECE_TCG correctly', () => {
      expect(formatGameName('ONE_PIECE_TCG')).toBe('One Piece TCG');
    });

    it('should format AZUKI_TCG correctly', () => {
      expect(formatGameName('AZUKI_TCG')).toBe('Azuki TCG');
    });

    it('should format RIFTBOUND correctly', () => {
      expect(formatGameName('RIFTBOUND')).toBe('Riftbound');
    });

    it('should handle unknown game types', () => {
      expect(formatGameName('UNKNOWN_GAME')).toBe('Unknown Game');
    });
  });

  describe('formatEventFormat', () => {
    it('should format SWISS correctly', () => {
      expect(formatEventFormat('SWISS')).toBe('Swiss');
    });

    it('should format SINGLE_ELIMINATION correctly', () => {
      expect(formatEventFormat('SINGLE_ELIMINATION')).toBe('Single Elimination');
    });

    it('should format DOUBLE_ELIMINATION correctly', () => {
      expect(formatEventFormat('DOUBLE_ELIMINATION')).toBe('Double Elimination');
    });

    it('should handle unknown formats', () => {
      expect(formatEventFormat('UNKNOWN_FORMAT')).toBe('Unknown Format');
    });
  });
});
