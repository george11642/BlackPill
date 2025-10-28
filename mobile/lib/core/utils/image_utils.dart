import 'dart:io';
import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';

/// Image processing utilities
class ImageUtils {
  /// Compress image to meet size requirements
  static Future<File> compressImage(File file, {
    int quality = 85,
    int maxWidth = 1920,
    int maxHeight = 1920,
  }) async {
    // Read image
    final bytes = await file.readAsBytes();
    final image = img.decodeImage(bytes);
    
    if (image == null) {
      throw Exception('Failed to decode image');
    }
    
    // Resize if needed
    img.Image resized = image;
    if (image.width > maxWidth || image.height > maxHeight) {
      resized = img.copyResize(
        image,
        width: image.width > image.height ? maxWidth : null,
        height: image.height > image.width ? maxHeight : null,
      );
    }
    
    // Compress as JPEG
    final compressed = img.encodeJpg(resized, quality: quality);
    
    // Write to temporary file
    final tempDir = await getTemporaryDirectory();
    final tempFile = File('${tempDir.path}/compressed_${DateTime.now().millisecondsSinceEpoch}.jpg');
    await tempFile.writeAsBytes(compressed);
    
    return tempFile;
  }

  /// Get image file size in MB
  static Future<double> getFileSizeMB(File file) async {
    final bytes = await file.length();
    return bytes / (1024 * 1024);
  }

  /// Validate image meets requirements
  static Future<String?> validateImage(File file) async {
    // Check file size
    final sizeMB = await getFileSizeMB(file);
    if (sizeMB > 2.0) {
      return 'Image must be less than 2MB. Current size: ${sizeMB.toStringAsFixed(1)}MB';
    }
    
    // Read image to check dimensions
    final bytes = await file.readAsBytes();
    final image = img.decodeImage(bytes);
    
    if (image == null) {
      return 'Invalid image file';
    }
    
    // Check minimum resolution
    if (image.width < 640 || image.height < 640) {
      return 'Image resolution too low. Minimum: 640x640px';
    }
    
    return null; // Valid
  }

  /// Create thumbnail from image
  static Future<File> createThumbnail(File file, {int size = 200}) async {
    final bytes = await file.readAsBytes();
    final image = img.decodeImage(bytes);
    
    if (image == null) {
      throw Exception('Failed to decode image');
    }
    
    // Resize to thumbnail
    final thumbnail = img.copyResizeCropSquare(image, size: size);
    
    // Compress
    final compressed = img.encodeJpg(thumbnail, quality: 80);
    
    // Write to file
    final tempDir = await getTemporaryDirectory();
    final thumbFile = File('${tempDir.path}/thumb_${DateTime.now().millisecondsSinceEpoch}.jpg');
    await thumbFile.writeAsBytes(compressed);
    
    return thumbFile;
  }
}


