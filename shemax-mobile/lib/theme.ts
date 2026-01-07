import { Platform } from 'react-native';

// SheMax Premium Theme Configuration
// Luxury Dark aesthetic with rose gold/pink accents

// Helper to create cross-platform shadows
const createShadow = (
  color: string,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number
) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0px ${offsetY}px ${radius}px rgba(${color === '#E8A0BF' ? '232, 160, 191' : '0, 0, 0'}, ${opacity})`,
    };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: elevation,
  };
};

export const DarkTheme = {
  colors: {
    // Backgrounds - Pure black to deep charcoal
    background: '#000000',
    backgroundSecondary: '#0A0A0F',
    card: '#111116',
    cardElevated: '#18181F',
    surface: '#1C1C24',
    
    // Rose Gold/Pink Accents - Premium feel
    primary: '#E8A0BF',        // Dusty rose
    primaryLight: '#FFD9E8',   // Soft pink
    primaryDark: '#C77DA2',    // Deep rose
    accent: '#D4AF37',         // Gold accent
    
    // Secondary colors
    secondary: '#F5F5F0',      // Warm white
    secondaryDark: '#C9C9C4',  // Muted warm white
    
    // Semantic colors
    success: '#4ADE80',        // Green
    warning: '#FBBF24',        // Amber warning
    error: '#EF4444',          // Red
    info: '#60A5FA',           // Blue
    
    // Text hierarchy
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textTertiary: '#71717A',
    textDisabled: '#52525B',
    textGold: '#E8A0BF',
    
    // Borders and dividers
    border: 'rgba(232, 160, 191, 0.2)',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    borderGold: 'rgba(232, 160, 191, 0.5)',
    
    // Glass effects
    glass: 'rgba(17, 17, 22, 0.85)',
    glassLight: 'rgba(28, 28, 36, 0.7)',
    glassBorder: 'rgba(232, 160, 191, 0.15)',
    
    // Gradients (defined as arrays for LinearGradient)
    gradientGold: ['#E8A0BF', '#FFD9E8', '#D4AF37'],
    gradientDark: ['#000000', '#0A0A0F', '#111116'],
    gradientCard: ['rgba(17, 17, 22, 0.9)', 'rgba(28, 28, 36, 0.8)'],
    gradientPremium: ['#E8A0BF', '#C77DA2'],
    
    // Score colors (gradient from low to high)
    scoreLow: '#EF4444',       // Red for low scores
    scoreMid: '#FBBF24',       // Amber for mid scores
    scoreHigh: '#4ADE80',      // Green for high scores
    scorePerfect: '#E8A0BF',   // Rose for perfect scores
  },
  
  typography: {
    // Premium font family
    fontFamily: 'Inter',
    fontFamilyBold: 'Inter',
    
    // Display - Large headlines
    display: {
      fontSize: 48,
      fontWeight: '700' as const,
      letterSpacing: -1.5,
      lineHeight: 56,
    },
    
    // H1 - Page titles
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
      lineHeight: 40,
    },
    
    // H2 - Section headers
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      letterSpacing: -0.3,
      lineHeight: 32,
    },
    
    // H3 - Card titles
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      letterSpacing: 0,
      lineHeight: 28,
    },
    
    // Body - Regular text
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 24,
    },
    
    // Body small
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 20,
    },
    
    // Caption - Small labels
    caption: {
      fontSize: 12,
      fontWeight: '500' as const,
      letterSpacing: 0.2,
      lineHeight: 16,
    },
    
    // Button text
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
      lineHeight: 24,
    },
    
    // Score display - Large numbers
    score: {
      fontSize: 72,
      fontWeight: '700' as const,
      letterSpacing: -2,
      lineHeight: 80,
    },
    
    // Score label
    scoreLabel: {
      fontSize: 14,
      fontWeight: '500' as const,
      letterSpacing: 1,
      lineHeight: 20,
      textTransform: 'uppercase' as const,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  shadows: {
    sm: createShadow('#000', 2, 0.25, 4, 2),
    md: createShadow('#000', 4, 0.3, 8, 4),
    lg: createShadow('#000', 8, 0.4, 16, 8),
    gold: createShadow('#E8A0BF', 4, 0.3, 12, 6),
    glow: createShadow('#E8A0BF', 0, 0.5, 20, 10),
  },
  
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 800,
  },
};

// Helper function to get score color based on value
// Matches analysis screen logic: >= 8 is green (high score), < 5 is red (low score)
export const getScoreColor = (score: number): string => {
  if (score >= 8) return DarkTheme.colors.success; // Green for high scores
  if (score >= 5) return DarkTheme.colors.warning; // Amber for mid scores
  return DarkTheme.colors.error; // Red for low scores
};

// Helper function to get percentile text
export const getPercentileText = (score: number): string => {
  // Approximate percentile based on normal distribution
  const percentile = Math.min(99, Math.round(score * 10));
  return `Better than ${percentile}% of people`;
};

// Light theme placeholder (can be expanded later)
export const LightTheme = {
  ...DarkTheme,
};

export default DarkTheme;
