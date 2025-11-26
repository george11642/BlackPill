// Black Pill Theme Configuration
// Matching Flutter design system from PRD.md

export const DarkTheme = {
  colors: {
    // Backgrounds
    background: '#0F0F1E',      // Deep Black
    card: '#1A1A2E',            // Dark Gray (cards)
    hover: '#2A2A3E',          // Charcoal (hover)
    
    // Neon Accents
    primary: '#FF0080',         // Pink (primary actions)
    secondary: '#00D9FF',       // Cyan (secondary actions)
    premium: '#B700FF',         // Purple (premium)
    warning: '#FFFF00',         // Yellow (warnings)
    success: '#00FF41',         // Green (success)
    
    // Text
    text: '#FFFFFF',            // Primary text
    textSecondary: '#B8BACC',   // Secondary text
    textTertiary: '#6B6D7F',    // Tertiary text
    textDisabled: '#4A4C5A',   // Disabled text
    
    // Borders
    border: 'rgba(255,255,255,0.1)',
    
    // Glass card effect
    glassCard: 'rgba(26,26,46,0.7)',
  },
  typography: {
    fontFamily: 'Inter',
    h1: {
      fontSize: 36,
      fontWeight: '700',
      letterSpacing: -1,
    },
    body: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 22.4, // 1.6 line-height
    },
    button: {
      fontSize: 14,
      fontWeight: '600',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
};

export const LightTheme = {
  // Light theme can be added later if needed
  ...DarkTheme,
};

