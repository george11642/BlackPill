/// Analysis model representing a completed facial analysis
class AnalysisModel {
  final String id;
  final String userId;
  final double score;
  final BreakdownModel breakdown;
  final List<TipModel> tips;
  final String? imageUrl;
  final String? imageThumbnailUrl;
  final bool isPublic;
  final int viewCount;
  final int likeCount;
  final DateTime createdAt;

  const AnalysisModel({
    required this.id,
    required this.userId,
    required this.score,
    required this.breakdown,
    required this.tips,
    this.imageUrl,
    this.imageThumbnailUrl,
    required this.isPublic,
    required this.viewCount,
    required this.likeCount,
    required this.createdAt,
  });

  factory AnalysisModel.fromJson(Map<String, dynamic> json) {
    return AnalysisModel(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      score: (json['score'] as num).toDouble(),
      breakdown: BreakdownModel.fromJson(json['breakdown'] as Map<String, dynamic>),
      tips: (json['tips'] as List)
          .map((tip) => TipModel.fromJson(tip as Map<String, dynamic>))
          .toList(),
      imageUrl: json['image_url'] as String?,
      imageThumbnailUrl: json['image_thumbnail_url'] as String?,
      isPublic: json['is_public'] as bool? ?? false,
      viewCount: json['view_count'] as int? ?? 0,
      likeCount: json['like_count'] as int? ?? 0,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'score': score,
      'breakdown': breakdown.toJson(),
      'tips': tips.map((tip) => tip.toJson()).toList(),
      'image_url': imageUrl,
      'image_thumbnail_url': imageThumbnailUrl,
      'is_public': isPublic,
      'view_count': viewCount,
      'like_count': likeCount,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

/// Breakdown scores for 6 facial features
class BreakdownModel {
  final double symmetry;
  final double jawline;
  final double eyes;
  final double lips;
  final double skin;
  final double boneStructure;

  const BreakdownModel({
    required this.symmetry,
    required this.jawline,
    required this.eyes,
    required this.lips,
    required this.skin,
    required this.boneStructure,
  });

  factory BreakdownModel.fromJson(Map<String, dynamic> json) {
    return BreakdownModel(
      symmetry: (json['symmetry'] as num).toDouble(),
      jawline: (json['jawline'] as num).toDouble(),
      eyes: (json['eyes'] as num).toDouble(),
      lips: (json['lips'] as num).toDouble(),
      skin: (json['skin'] as num).toDouble(),
      boneStructure: (json['bone_structure'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'symmetry': symmetry,
      'jawline': jawline,
      'eyes': eyes,
      'lips': lips,
      'skin': skin,
      'bone_structure': boneStructure,
    };
  }

  double get average => (symmetry + jawline + eyes + lips + skin + boneStructure) / 6;
}

/// Improvement tip model
class TipModel {
  final String title;
  final String description;
  final String timeframe;

  const TipModel({
    required this.title,
    required this.description,
    required this.timeframe,
  });

  factory TipModel.fromJson(Map<String, dynamic> json) {
    return TipModel(
      title: json['title'] as String,
      description: json['description'] as String,
      timeframe: json['timeframe'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'timeframe': timeframe,
    };
  }
}


