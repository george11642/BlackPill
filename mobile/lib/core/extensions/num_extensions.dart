/// Extensions for num (int, double)
extension NumExtensions on num {
  /// Format as score (1 decimal place)
  String get asScore => toStringAsFixed(1);

  /// Format as percentage
  String get asPercentage => '${toStringAsFixed(1)}%';

  /// Format as currency (USD)
  String get asCurrency => '\$${toStringAsFixed(2)}';

  /// Clamp between min and max
  num clampTo(num min, num max) => clamp(min, max);

  /// Check if score is high (≥7.5)
  bool get isHighScore => this >= 7.5;

  /// Check if score is medium (5.0-7.4)
  bool get isMediumScore => this >= 5.0 && this < 7.5;

  /// Check if score is low (<5.0)
  bool get isLowScore => this < 5.0;

  /// Get score color based on value
  String get scoreColorHex {
    if (isHighScore) return '#00FF41'; // neonGreen
    if (isMediumScore) return '#00D9FF'; // neonCyan
    return '#FFFF00'; // neonYellow
  }
}


