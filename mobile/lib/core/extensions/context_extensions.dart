import 'package:flutter/material.dart';

/// Extensions for BuildContext
extension ContextExtensions on BuildContext {
  /// Get theme data
  ThemeData get theme => Theme.of(this);
  
  /// Get text theme
  TextTheme get textTheme => Theme.of(this).textTheme;
  
  /// Get color scheme
  ColorScheme get colorScheme => Theme.of(this).colorScheme;
  
  /// Get media query
  MediaQueryData get mediaQuery => MediaQuery.of(this);
  
  /// Get screen size
  Size get screenSize => mediaQuery.size;
  
  /// Get screen width
  double get screenWidth => screenSize.width;
  
  /// Get screen height
  double get screenHeight => screenSize.height;
  
  /// Check if keyboard is visible
  bool get isKeyboardVisible => mediaQuery.viewInsets.bottom > 0;
  
  /// Get safe area padding
  EdgeInsets get safeArea => mediaQuery.padding;
  
  /// Show snackbar with success styling
  void showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(this).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFF00FF41), // neonGreen
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );
  }
  
  /// Show snackbar with error styling
  void showErrorSnackBar(String message) {
    ScaffoldMessenger.of(this).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFFFFFF00), // neonYellow
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 4),
      ),
    );
  }
  
  /// Show snackbar with info styling
  void showInfoSnackBar(String message) {
    ScaffoldMessenger.of(this).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFF00D9FF), // neonCyan
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );
  }
  
  /// Hide keyboard
  void hideKeyboard() {
    FocusScope.of(this).unfocus();
  }
}


