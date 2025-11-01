import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:path/path.dart' as path;
import 'package:uuid/uuid.dart';

import '../utils/image_utils.dart';

final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

class StorageService {
  final SupabaseClient _supabase = Supabase.instance.client;
  final _uuid = const Uuid();

  /// Upload image to Supabase Storage
  /// Returns the public URL of the uploaded image
  Future<String> uploadImage({
    required File imageFile,
    required String bucket,
    String? folder,
    int maxWidth = 1920,
    int maxHeight = 1920,
    int quality = 85,
    Function(double)? onProgress,
  }) async {
    try {
      // Compress image before upload
      final compressedFile = await ImageUtils.compressImage(
        imageFile,
        quality: quality,
        maxWidth: maxWidth,
        maxHeight: maxHeight,
      );

      // Generate unique filename
      final extension = path.extension(imageFile.path);
      final filename = '${_uuid.v4()}$extension';
      final filePath = folder != null ? '$folder/$filename' : filename;

      // Upload to Supabase Storage
      await _supabase.storage.from(bucket).upload(
        filePath,
        compressedFile,
        fileOptions: const FileOptions(
          contentType: 'image/jpeg',
          upsert: false,
        ),
      );

      // Get public URL
      final url = _supabase.storage.from(bucket).getPublicUrl(filePath);
      
      return url;
    } catch (e) {
      throw Exception('Failed to upload image: ${e.toString()}');
    }
  }

  /// Upload challenge check-in photo
  Future<String> uploadChallengePhoto({
    required File imageFile,
    required String userId,
    required String challengeId,
    Function(double)? onProgress,
  }) async {
    return uploadImage(
      imageFile: imageFile,
      bucket: 'challenge-photos',
      folder: '$userId/$challengeId',
      onProgress: onProgress,
    );
  }

  /// Delete image from Supabase Storage
  Future<void> deleteImage({
    required String bucket,
    required String filePath,
  }) async {
    try {
      await _supabase.storage.from(bucket).remove([filePath]);
    } catch (e) {
      throw Exception('Failed to delete image: ${e.toString()}');
    }
  }
}

