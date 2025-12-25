import { Asset } from 'expo-asset';
import { Image } from 'react-native';

// Preload all ranked border images (excluding sprout - uses green border instead)
const RANKED_BORDER_IMAGES = [
  require('../assets/ranked-borders/genki.png'),
  require('../assets/ranked-borders/diamond.png'),
  require('../assets/ranked-borders/platinum.png'),
  require('../assets/ranked-borders/gold.png'),
  require('../assets/ranked-borders/silver.png'),
  require('../assets/ranked-borders/bronze.png'),
];

export async function preloadRankedBorders() {
  try {
    // Preload using expo-asset for caching
    const cacheImages = RANKED_BORDER_IMAGES.map((image) => {
      return Asset.fromModule(image).downloadAsync();
    });

    await Promise.all(cacheImages);

    // Also prefetch for React Native Image component
    RANKED_BORDER_IMAGES.forEach((image) => {
      Image.prefetch(Image.resolveAssetSource(image).uri);
    });
  } catch (error) {
    console.warn('Failed to preload ranked borders:', error);
  }
}
