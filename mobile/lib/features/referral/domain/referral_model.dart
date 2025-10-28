/// Referral model
class ReferralModel {
  final String id;
  final String fromUserId;
  final String? toUserId;
  final String referralCode;
  final int bonusScansGiven;
  final String status;
  final DateTime? acceptedAt;
  final DateTime createdAt;

  const ReferralModel({
    required this.id,
    required this.fromUserId,
    this.toUserId,
    required this.referralCode,
    required this.bonusScansGiven,
    required this.status,
    this.acceptedAt,
    required this.createdAt,
  });

  factory ReferralModel.fromJson(Map<String, dynamic> json) {
    return ReferralModel(
      id: json['id'] as String,
      fromUserId: json['from_user_id'] as String,
      toUserId: json['to_user_id'] as String?,
      referralCode: json['referral_code'] as String,
      bonusScansGiven: json['bonus_scans_given'] as int? ?? 5,
      status: json['status'] as String? ?? 'pending',
      acceptedAt: json['accepted_at'] != null
          ? DateTime.parse(json['accepted_at'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'from_user_id': fromUserId,
      'to_user_id': toUserId,
      'referral_code': referralCode,
      'bonus_scans_given': bonusScansGiven,
      'status': status,
      'accepted_at': acceptedAt?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
    };
  }

  bool get isPending => status == 'pending';
  bool get isAccepted => status == 'accepted';
  bool get isExpired => status == 'expired';
}

/// Referral stats model
class ReferralStatsModel {
  final String referralCode;
  final int totalInvited;
  final int accepted;
  final int pending;
  final int totalBonusScans;
  final int inviteStreak;

  const ReferralStatsModel({
    required this.referralCode,
    required this.totalInvited,
    required this.accepted,
    required this.pending,
    required this.totalBonusScans,
    required this.inviteStreak,
  });

  factory ReferralStatsModel.fromJson(Map<String, dynamic> json) {
    return ReferralStatsModel(
      referralCode: json['referral_code'] as String,
      totalInvited: json['total_invited'] as int,
      accepted: json['accepted'] as int,
      pending: json['pending'] as int,
      totalBonusScans: json['total_bonus_scans'] as int,
      inviteStreak: json['invite_streak'] as int,
    );
  }

  double get acceptanceRate {
    if (totalInvited == 0) return 0.0;
    return (accepted / totalInvited) * 100;
  }
}


