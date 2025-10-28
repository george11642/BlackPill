/// User model representing authenticated user
class UserModel {
  final String id;
  final String email;
  final String tier;
  final int scansRemaining;
  final int totalScansUsed;
  final String referralCode;
  final String? username;
  final String? avatarUrl;
  final String? bio;
  final String? location;
  final bool ageVerified;
  final DateTime createdAt;
  final DateTime? lastActive;

  const UserModel({
    required this.id,
    required this.email,
    required this.tier,
    required this.scansRemaining,
    required this.totalScansUsed,
    required this.referralCode,
    this.username,
    this.avatarUrl,
    this.bio,
    this.location,
    required this.ageVerified,
    required this.createdAt,
    this.lastActive,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String,
      tier: json['tier'] as String? ?? 'free',
      scansRemaining: json['scans_remaining'] as int? ?? 0,
      totalScansUsed: json['total_scans_used'] as int? ?? 0,
      referralCode: json['referral_code'] as String,
      username: json['username'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      bio: json['bio'] as String?,
      location: json['location'] as String?,
      ageVerified: json['age_verified'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      lastActive: json['last_active'] != null
          ? DateTime.parse(json['last_active'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'tier': tier,
      'scans_remaining': scansRemaining,
      'total_scans_used': totalScansUsed,
      'referral_code': referralCode,
      'username': username,
      'avatar_url': avatarUrl,
      'bio': bio,
      'location': location,
      'age_verified': ageVerified,
      'created_at': createdAt.toIso8601String(),
      'last_active': lastActive?.toIso8601String(),
    };
  }

  UserModel copyWith({
    String? username,
    String? avatarUrl,
    String? bio,
    String? location,
    int? scansRemaining,
    String? tier,
  }) {
    return UserModel(
      id: id,
      email: email,
      tier: tier ?? this.tier,
      scansRemaining: scansRemaining ?? this.scansRemaining,
      totalScansUsed: totalScansUsed,
      referralCode: referralCode,
      username: username ?? this.username,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      bio: bio ?? this.bio,
      location: location ?? this.location,
      ageVerified: ageVerified,
      createdAt: createdAt,
      lastActive: lastActive,
    );
  }

  bool get isPremium => tier != 'free';
  bool get hasScansRemaining => scansRemaining > 0;
}


