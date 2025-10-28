import 'package:intl/intl.dart';

/// Date formatting utilities
class DateFormatter {
  /// Format date as "Oct 27, 2025"
  static String format(DateTime date) {
    return DateFormat('MMM dd, yyyy').format(date);
  }

  /// Format date and time as "Oct 27, 2025 at 3:45 PM"
  static String formatDateTime(DateTime dateTime) {
    return DateFormat('MMM dd, yyyy \'at\' h:mm a').format(dateTime);
  }

  /// Format time ago (e.g., "2 hours ago", "3 days ago")
  static String timeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      final minutes = difference.inMinutes;
      return '$minutes ${minutes == 1 ? 'minute' : 'minutes'} ago';
    } else if (difference.inHours < 24) {
      final hours = difference.inHours;
      return '$hours ${hours == 1 ? 'hour' : 'hours'} ago';
    } else if (difference.inDays < 7) {
      final days = difference.inDays;
      return '$days ${days == 1 ? 'day' : 'days'} ago';
    } else if (difference.inDays < 30) {
      final weeks = (difference.inDays / 7).floor();
      return '$weeks ${weeks == 1 ? 'week' : 'weeks'} ago';
    } else if (difference.inDays < 365) {
      final months = (difference.inDays / 30).floor();
      return '$months ${months == 1 ? 'month' : 'months'} ago';
    } else {
      final years = (difference.inDays / 365).floor();
      return '$years ${years == 1 ? 'year' : 'years'} ago';
    }
  }

  /// Format date for charts (e.g., "Oct 27")
  static String formatChartDate(DateTime date) {
    return DateFormat('MMM dd').format(date);
  }

  /// Format month and year (e.g., "October 2025")
  static String formatMonthYear(DateTime date) {
    return DateFormat('MMMM yyyy').format(date);
  }

  /// Check if date is today
  static bool isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year && 
           date.month == now.month && 
           date.day == now.day;
  }

  /// Check if date is within last week
  static bool isThisWeek(DateTime date) {
    final now = DateTime.now();
    final weekAgo = now.subtract(const Duration(days: 7));
    return date.isAfter(weekAgo);
  }
}


