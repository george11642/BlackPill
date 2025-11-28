import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { Play, Download, Share2, CheckCircle2, X } from 'lucide-react-native';
import { apiPost } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { BackHeader } from '../components/BackHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { MusicSelector, MusicTrack } from '../components/MusicSelector';
import { DarkTheme } from '../lib/theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TimelapseResult {
  timelapse_id: string;
  frame_urls: string[];
  video_url?: string;
  duration: number;
  frame_count: number;
  status?: 'ready' | 'frames_ready';
}

export function TimelapseGenerationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { session } = useAuth();
  const { analysisIds } = route.params as { analysisIds: string[] };

  const [generating, setGenerating] = useState(true);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TimelapseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    generateTimelapse();
    startPulseAnimation();
  }, []);

  useEffect(() => {
    if (result && playing) {
      startSlideshow();
    } else {
      stopSlideshow();
    }
    return () => stopSlideshow();
  }, [result, playing]);

  const startPulseAnimation = () => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      false
    );
  };

  const startSlideshow = () => {
    if (!result || result.frame_urls.length === 0) return;

    const frameDuration = (result.duration * 1000) / result.frame_urls.length;
    let index = 0;

    frameIntervalRef.current = setInterval(() => {
      index = (index + 1) % result.frame_urls.length;
      setCurrentFrameIndex(index);
    }, frameDuration);
  };

  const stopSlideshow = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
  };

  const generateTimelapse = async () => {
    try {
      setGenerating(true);
      setProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await apiPost<TimelapseResult>(
        '/api/timelapse/generate',
        {
          analysis_ids: analysisIds,
          options: {
            duration: Math.min(10, Math.max(3, analysisIds.length * 0.5)),
            showScores: true,
            showDates: true,
          },
        },
        session?.access_token
      );

      clearInterval(progressInterval);
      setProgress(100);
      setResult(response);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('Timelapse generation error:', err);
      setError(err.message || 'Failed to generate timelapse');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!result || result.frame_urls.length === 0) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // For now, share the first frame as an image
      // TODO: In production, share actual video file
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(result.frame_urls[0], {
          mimeType: 'image/png',
          dialogTitle: 'Share your timelapse',
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share timelapse');
    }
  };

  const handleDownload = async () => {
    if (!result || isDownloading) return;

    try {
      setIsDownloading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // If server generated video (without music), use it directly
      if (result.video_url && !selectedMusic) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(result.video_url, {
            mimeType: 'video/mp4',
            dialogTitle: 'Download Timelapse Video',
          });
        } else {
          Alert.alert('Download Ready', result.video_url);
        }
        setIsDownloading(false);
        return;
      }

      // Generate video client-side (required for music mixing)
      if (result.frame_urls.length < 2) {
        Alert.alert('Error', 'Not enough frames to generate video');
        setIsDownloading(false);
        return;
      }

      // Dynamically import video generator
      const { generateVideoFromFramesClient, downloadBlobAsFile } = await import('../lib/video/ffmpeg-client');

      console.log('Starting video generation...');
      console.log('Music selected:', selectedMusic?.name || 'None');
      console.log('Music URL:', selectedMusic?.file_url || 'N/A');

      // Generate video with optional music
      const videoBlob = await generateVideoFromFramesClient(
        result.frame_urls,
        result.duration,
        {
          musicUrl: selectedMusic?.file_url,
          musicVolume: 0.5,
        }
      );

      console.log('Video generated, blob size:', videoBlob.size);

      // Platform-specific handling
      const { Platform } = await import('react-native');
      
      if (Platform.OS === 'web') {
        // On web, download the file directly
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `blackpill-timelapse-${timestamp}.webm`;
        console.log('Downloading as:', filename);
        
        // Wait for download to complete
        await downloadBlobAsFile(videoBlob, filename);
        
        Alert.alert('Success', 'Your timelapse video has been downloaded!');
      } else {
        // On native, try to share
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(base64, {
              mimeType: 'video/webm',
              dialogTitle: 'Share Your Timelapse',
            });
          } else {
            Alert.alert('Video Ready', 'Your timelapse video has been generated!');
          }
        };
        reader.readAsDataURL(videoBlob);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert('Error', error.message || 'Failed to generate video');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsDownloading(false);
    }
  };

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  if (error) {
    return (
      <View style={styles.container}>
        <BackHeader title="Timelapse Generation" variant="large" />
        <View style={styles.errorContainer}>
          <GlassCard variant="subtle" style={styles.errorCard}>
            <X size={48} color={DarkTheme.colors.error} />
            <Text style={styles.errorTitle}>Generation Failed</Text>
            <Text style={styles.errorText}>{error}</Text>
            <PrimaryButton
              title="Try Again"
              onPress={generateTimelapse}
              style={styles.retryButton}
            />
          </GlassCard>
        </View>
      </View>
    );
  }

  if (generating) {
    return (
      <View style={styles.container}>
        <BackHeader title="Generating Timelapse" />
        <View style={styles.generatingContainer}>
          <Animated.View style={[styles.pulseCircle, pulseAnimatedStyle]}>
            <View style={styles.innerCircle}>
              <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
            </View>
          </Animated.View>
          <Text style={styles.generatingTitle}>Creating your timelapse...</Text>
          <Text style={styles.generatingSubtitle}>
            Processing {analysisIds.length} photos
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      </View>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BackHeader title="Your Timelapse" />
      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard variant="gold" style={styles.previewCard}>
          <View style={styles.previewContainer}>
            {result.frame_urls.length > 0 && (
              <Image
                source={{ uri: result.frame_urls[currentFrameIndex] }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.previewGradient}
            />
            {playing && (
              <View style={styles.playingIndicator}>
                <Play size={24} color={DarkTheme.colors.primary} fill={DarkTheme.colors.primary} />
              </View>
            )}
          </View>
        </GlassCard>

        <GlassCard variant="subtle" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{result.duration.toFixed(1)}s</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Frames</Text>
            <Text style={styles.infoValue}>{result.frame_count}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <CheckCircle2 size={16} color={DarkTheme.colors.success} />
              <Text style={styles.statusText}>Ready</Text>
            </View>
          </View>
        </GlassCard>

        {/* Music Selection */}
        <MusicSelector
          selectedTrack={selectedMusic}
          onSelectTrack={setSelectedMusic}
        />

        <View style={styles.actions}>
          <PrimaryButton
            title={playing ? 'Pause' : 'Play Preview'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPlaying(!playing);
            }}
            icon={<Play size={18} color={DarkTheme.colors.background} />}
            style={styles.actionButton}
          />
          <TouchableOpacity
            style={[styles.secondaryButton, isDownloading && styles.secondaryButtonDisabled]}
            onPress={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={DarkTheme.colors.primary} />
            ) : (
              <Download size={20} color={DarkTheme.colors.primary} />
            )}
            <Text style={styles.secondaryButtonText}>
              {isDownloading ? 'Creating...' : 'Download'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleShare}
          >
            <Share2 size={20} color={DarkTheme.colors.primary} />
            <Text style={styles.secondaryButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        <GlassCard variant="subtle" style={styles.noteCard}>
          <Text style={styles.noteText}>
            {result.status === 'ready'
              ? 'Your timelapse video is ready to download!'
              : 'Note: Your timelapse is ready to preview. You can download frames individually or wait for the full video to be generated.'}
          </Text>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  generatingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DarkTheme.spacing.xl,
  },
  pulseCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${DarkTheme.colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DarkTheme.spacing.xl,
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DarkTheme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.sm,
  },
  generatingSubtitle: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xl,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: DarkTheme.colors.borderSubtle,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: DarkTheme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: DarkTheme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  errorContainer: {
    flex: 1,
    padding: DarkTheme.spacing.xl,
    justifyContent: 'center',
  },
  errorCard: {
    alignItems: 'center',
    padding: DarkTheme.spacing.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.sm,
  },
  errorText: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  retryButton: {
    marginTop: DarkTheme.spacing.md,
  },
  content: {
    padding: DarkTheme.spacing.md,
    paddingBottom: DarkTheme.spacing.xl,
  },
  previewCard: {
    marginBottom: DarkTheme.spacing.md,
    overflow: 'hidden',
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: DarkTheme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: DarkTheme.colors.surface,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  playingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    padding: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${DarkTheme.colors.success}20`,
    paddingHorizontal: DarkTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: DarkTheme.borderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.colors.success,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  actions: {
    flexDirection: 'row',
    gap: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DarkTheme.spacing.xs,
    padding: DarkTheme.spacing.md,
    borderRadius: DarkTheme.borderRadius.md,
    backgroundColor: DarkTheme.colors.card,
    borderWidth: 1,
    borderColor: DarkTheme.colors.border,
  },
  secondaryButtonDisabled: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  noteCard: {
    padding: DarkTheme.spacing.md,
  },
  noteText: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    lineHeight: 18,
  },
});

