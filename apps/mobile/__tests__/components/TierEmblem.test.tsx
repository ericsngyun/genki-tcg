import React from 'react';
import { render } from '@testing-library/react-native';
import { TierEmblem } from '../../components/TierEmblem';

describe('TierEmblem Component', () => {
  it('should render GENKI tier correctly', () => {
    const { getByText } = render(<TierEmblem tier="GENKI" size={48} />);
    expect(getByText('🔥')).toBeTruthy();
  });

  it('should render DIAMOND tier correctly', () => {
    const { getByText } = render(<TierEmblem tier="DIAMOND" size={48} />);
    expect(getByText('💎')).toBeTruthy();
  });

  it('should render PLATINUM tier correctly', () => {
    const { getByText } = render(<TierEmblem tier="PLATINUM" size={48} />);
    expect(getByText('💎')).toBeTruthy();
  });

  it('should render GOLD tier correctly', () => {
    const { getByText } = render(<TierEmblem tier="GOLD" size={48} />);
    expect(getByText('👑')).toBeTruthy();
  });

  it('should render SILVER tier correctly', () => {
    const { getByText } = render(<TierEmblem tier="SILVER" size={48} />);
    expect(getByText('🛡️')).toBeTruthy();
  });

  it('should render BRONZE tier correctly', () => {
    const { getByText } = render(<TierEmblem tier="BRONZE" size={48} />);
    expect(getByText('🛡️')).toBeTruthy();
  });

  it('should render SPROUT tier correctly', () => {
    const { getByText } = render(<TierEmblem tier="SPROUT" size={48} />);
    expect(getByText('🌱')).toBeTruthy();
  });

  it('should handle different sizes', () => {
    const { getByText: getByText24 } = render(<TierEmblem tier="GENKI" size={24} />);
    const { getByText: getByText64 } = render(<TierEmblem tier="GENKI" size={64} />);

    expect(getByText24('🔥')).toBeTruthy();
    expect(getByText64('🔥')).toBeTruthy();
  });
});
