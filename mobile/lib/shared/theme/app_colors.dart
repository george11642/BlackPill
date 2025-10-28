import 'package:flutter/material.dart';

/// App color palette following the design system
class AppColors {
  // Backgrounds
  static const Color deepBlack = Color(0xFF0F0F1E);
  static const Color darkGray = Color(0xFF1A1A2E);
  static const Color charcoal = Color(0xFF2A2A3E);
  
  // Neon Accents
  static const Color neonPink = Color(0xFFFF0080);
  static const Color neonCyan = Color(0xFF00D9FF);
  static const Color neonPurple = Color(0xFFB700FF);
  static const Color neonYellow = Color(0xFFFFFF00);
  static const Color neonGreen = Color(0xFF00FF41);
  
  // Text
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFB8BACC);
  static const Color textTertiary = Color(0xFF6B6D7F);
  static const Color textDisabled = Color(0xFF4A4C5A);
  
  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [neonPink, neonCyan],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient secondaryGradient = LinearGradient(
    colors: [neonCyan, neonPurple],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient premiumGradient = LinearGradient(
    colors: [neonPurple, neonPink],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  // Glassmorphism
  static Color get glassBackground => darkGray.withOpacity(0.7);
  static Color get glassBorder => Colors.white.withOpacity(0.1);
}

