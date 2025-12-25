import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SvgUri } from 'react-native-svg';

type Element = 'water' | 'lightning' | 'earth' | 'fire';

interface ElementConfig {
  name: string;
  icon: string;
  color: string;
  darkColor: string;
}

const ELEMENTS: Record<Element, ElementConfig> = {
  water: {
    name: 'Shao',
    icon: 'https://tcg.azuki.com/icons/water.svg',
    color: '#3b82f6',
    darkColor: '#1e3a8a',
  },
  lightning: {
    name: 'Raizan',
    icon: 'https://tcg.azuki.com/icons/lightning.svg',
    color: '#a78bfa',
    darkColor: '#4c1d95',
  },
  earth: {
    name: 'Bobu',
    icon: 'https://tcg.azuki.com/icons/earth.svg',
    color: '#f97316',
    darkColor: '#7c2d12',
  },
  fire: {
    name: 'Zero',
    icon: 'https://tcg.azuki.com/icons/fire.svg',
    color: '#ef4444',
    darkColor: '#7f1d1d',
  },
};

export default function LifeCounterScreen() {
  const router = useRouter();
  const [gameStarted, setGameStarted] = useState(false);
  const [player1Element, setPlayer1Element] = useState<Element | null>(null);
  const [player2Element, setPlayer2Element] = useState<Element | null>(null);
  const [player1Life, setPlayer1Life] = useState(20);
  const [player2Life, setPlayer2Life] = useState(20);

  const startGame = () => {
    if (player1Element && player2Element) {
      setGameStarted(true);
      setPlayer1Life(20);
      setPlayer2Life(20);
    }
  };

  const adjustLife = (player: 'player1' | 'player2', amount: number) => {
    Vibration.vibrate(10);

    if (player === 'player1') {
      const newLife = Math.max(0, player1Life + amount);
      setPlayer1Life(newLife);

      if (newLife === 0 && player1Life > 0) {
        setTimeout(() => {
          Alert.alert('Game Over', `Player 2 (${ELEMENTS[player2Element!].name}) Wins!`, [
            { text: 'OK' }
          ]);
        }, 100);
      }
    } else {
      const newLife = Math.max(0, player2Life + amount);
      setPlayer2Life(newLife);

      if (newLife === 0 && player2Life > 0) {
        setTimeout(() => {
          Alert.alert('Game Over', `Player 1 (${ELEMENTS[player1Element!].name}) Wins!`, [
            { text: 'OK' }
          ]);
        }, 100);
      }
    }
  };

  const resetGame = () => {
    Alert.alert(
      'Reset',
      'Choose an option:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'New Game',
          onPress: () => {
            setGameStarted(false);
            setPlayer1Element(null);
            setPlayer2Element(null);
            setPlayer1Life(20);
            setPlayer2Life(20);
          },
        },
        {
          text: 'Reset Life',
          onPress: () => {
            setPlayer1Life(20);
            setPlayer2Life(20);
          },
        },
      ]
    );
  };

  // Element Selection Screen
  if (!gameStarted) {
    return (
      <View style={styles.setupContainer}>
        <StatusBar style="light" />

        {/* Back Button (Overlay) */}
        <TouchableOpacity
          style={styles.backButtonSetup}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="rgba(255, 255, 255, 0.7)" />
        </TouchableOpacity>

        {/* Player 1 Selection (Top - Rotated) */}
        <View style={styles.playerSelectionContainer}>
          <View style={[styles.selectionSection, { transform: [{ rotate: '180deg' }] }]}>
            <Text style={styles.playerLabel}>Player 1</Text>
            <Text style={styles.selectionHint}>Choose your element</Text>
            <View style={styles.elementRow}>
              {(Object.keys(ELEMENTS) as Element[]).map((element) => (
                <TouchableOpacity
                  key={element}
                  style={[
                    styles.elementButton,
                    player1Element === element && {
                      backgroundColor: ELEMENTS[element].color + '30',
                      borderColor: ELEMENTS[element].color,
                    },
                  ]}
                  onPress={() => setPlayer1Element(element)}
                >
                  <SvgUri
                    uri={ELEMENTS[element].icon}
                    width={40}
                    height={40}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {player1Element && (
              <Text style={[styles.selectedElement, { color: ELEMENTS[player1Element].color }]}>
                {ELEMENTS[player1Element].name}
              </Text>
            )}
          </View>
        </View>

        {/* Start Button */}
        <View style={styles.startButtonContainer}>
          <TouchableOpacity
            style={[
              styles.startButton,
              (!player1Element || !player2Element) && styles.startButtonDisabled,
            ]}
            onPress={startGame}
            disabled={!player1Element || !player2Element}
          >
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        </View>

        {/* Player 2 Selection (Bottom) */}
        <View style={styles.playerSelectionContainer}>
          <View style={styles.selectionSection}>
            <Text style={styles.playerLabel}>Player 2</Text>
            <Text style={styles.selectionHint}>Choose your element</Text>
            <View style={styles.elementRow}>
              {(Object.keys(ELEMENTS) as Element[]).map((element) => (
                <TouchableOpacity
                  key={element}
                  style={[
                    styles.elementButton,
                    player2Element === element && {
                      backgroundColor: ELEMENTS[element].color + '30',
                      borderColor: ELEMENTS[element].color,
                    },
                  ]}
                  onPress={() => setPlayer2Element(element)}
                >
                  <SvgUri
                    uri={ELEMENTS[element].icon}
                    width={40}
                    height={40}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {player2Element && (
              <Text style={[styles.selectedElement, { color: ELEMENTS[player2Element].color }]}>
                {ELEMENTS[player2Element].name}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Game Screen
  const p1Config = ELEMENTS[player1Element!];
  const p2Config = ELEMENTS[player2Element!];

  return (
    <View style={styles.gameContainer}>
      <StatusBar style="light" />

      {/* Back Button (Top Left) */}
      <TouchableOpacity
        style={styles.backButtonGame}
        onPress={() => {
          Alert.alert(
            'Exit Game',
            'Are you sure you want to exit? Game progress will be lost.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Exit',
                style: 'destructive',
                onPress: () => {
                  setGameStarted(false);
                  setPlayer1Element(null);
                  setPlayer2Element(null);
                  setPlayer1Life(20);
                  setPlayer2Life(20);
                }
              }
            ]
          );
        }}
      >
        <Ionicons name="arrow-back" size={20} color="rgba(255, 255, 255, 0.7)" />
      </TouchableOpacity>

      {/* Player 1 Side (Top - Rotated) */}
      <View
        style={[
          styles.playerSide,
          { backgroundColor: p1Config.darkColor },
          { transform: [{ rotate: '180deg' }] }
        ]}
      >
        {/* Element Icon Background */}
        <View style={styles.elementIconBackground}>
          <SvgUri uri={p1Config.icon} width={120} height={120} style={{ opacity: 0.15 }} />
        </View>

        {/* Left Side - Minus */}
        <TouchableOpacity
          style={styles.tapZone}
          onPress={() => adjustLife('player1', -1)}
          activeOpacity={0.8}
        >
          <View style={styles.tapIndicator}>
            <Ionicons name="remove-circle-outline" size={32} color="rgba(255, 255, 255, 0.4)" />
          </View>
        </TouchableOpacity>

        {/* Center - Life Display */}
        <View style={styles.lifeDisplay}>
          <Text style={styles.elementName}>{p1Config.name.toUpperCase()}</Text>
          <Text style={[
            styles.lifeNumber,
            player1Life <= 0 && styles.lifeNumberDead,
            player1Life <= 5 && player1Life > 0 && styles.lifeNumberLow
          ]}>
            {player1Life}
          </Text>
        </View>

        {/* Right Side - Plus */}
        <TouchableOpacity
          style={styles.tapZone}
          onPress={() => adjustLife('player1', 1)}
          activeOpacity={0.8}
        >
          <View style={styles.tapIndicator}>
            <Ionicons name="add-circle-outline" size={32} color="rgba(255, 255, 255, 0.4)" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Middle Control */}
      <View style={styles.middleControl}>
        <TouchableOpacity onPress={resetGame} style={styles.resetButton}>
          <Ionicons name="refresh" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Player 2 Side (Bottom) */}
      <View
        style={[
          styles.playerSide,
          { backgroundColor: p2Config.darkColor }
        ]}
      >
        {/* Element Icon Background */}
        <View style={styles.elementIconBackground}>
          <SvgUri uri={p2Config.icon} width={120} height={120} style={{ opacity: 0.15 }} />
        </View>

        {/* Left Side - Minus */}
        <TouchableOpacity
          style={styles.tapZone}
          onPress={() => adjustLife('player2', -1)}
          activeOpacity={0.8}
        >
          <View style={styles.tapIndicator}>
            <Ionicons name="remove-circle-outline" size={32} color="rgba(255, 255, 255, 0.4)" />
          </View>
        </TouchableOpacity>

        {/* Center - Life Display */}
        <View style={styles.lifeDisplay}>
          <Text style={styles.elementName}>{p2Config.name.toUpperCase()}</Text>
          <Text style={[
            styles.lifeNumber,
            player2Life <= 0 && styles.lifeNumberDead,
            player2Life <= 5 && player2Life > 0 && styles.lifeNumberLow
          ]}>
            {player2Life}
          </Text>
        </View>

        {/* Right Side - Plus */}
        <TouchableOpacity
          style={styles.tapZone}
          onPress={() => adjustLife('player2', 1)}
          activeOpacity={0.8}
        >
          <View style={styles.tapIndicator}>
            <Ionicons name="add-circle-outline" size={32} color="rgba(255, 255, 255, 0.4)" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Setup Screen
  setupContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  backButtonSetup: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 100,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  selectionSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  playerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  selectionHint: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
    marginBottom: 20,
  },
  elementRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  elementButton: {
    width: 70,
    height: 70,
    backgroundColor: '#1a1a24',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2a2a34',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedElement: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  startButtonContainer: {
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  startButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#2a2a34',
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Game Screen
  gameContainer: {
    flex: 1,
  },
  backButtonGame: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 100,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerSide: {
    flex: 1,
    position: 'relative',
    flexDirection: 'row',
  },
  elementIconBackground: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -60 }],
    zIndex: 0,
  },
  tapZone: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tapIndicator: {
    opacity: 0.6,
  },
  lifeDisplay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
    pointerEvents: 'none',
  },
  elementName: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 8,
  },
  lifeNumber: {
    fontSize: 100,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  lifeNumberLow: {
    color: '#facc15',
  },
  lifeNumberDead: {
    color: '#ef4444',
    opacity: 0.4,
  },
  middleControl: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    zIndex: 10,
  },
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
