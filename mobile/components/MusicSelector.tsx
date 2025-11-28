import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Music, Play, Pause, Check, Volume2 } from 'lucide-react-native';
import { DarkTheme } from '../lib/theme';
import { GlassCard } from './GlassCard';
import { apiGet } from '../lib/api/client';

export interface MusicTrack {
  id: string;
  name: string;
  description: string | null;
  file_url: string;
  duration_seconds: number;
  mood: string | null;
}

interface MusicSelectorProps {
  selectedTrack: MusicTrack | null;
  onSelectTrack: (track: MusicTrack | null) => void;
}

export function MusicSelector({ selectedTrack, onSelectTrack }: MusicSelectorProps) {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchTracks();
    return () => {
      // Cleanup audio on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const fetchTracks = async () => {
    try {
      const response = await apiGet<{ tracks: MusicTrack[] }>('/api/timelapse/music');
      setTracks(response.tracks || []);
    } catch (error) {
      console.error('Error fetching music tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPreview = async (track: MusicTrack) => {
    if (Platform.OS !== 'web') {
      // Audio preview not supported on native yet
      return;
    }

    try {
      if (playingTrackId === track.id) {
        // Stop playing
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setPlayingTrackId(null);
      } else {
        // Stop any currently playing audio
        if (audioRef.current) {
          audioRef.current.pause();
        }

        // Play new track
        const audio = new Audio(track.file_url);
        audio.volume = 0.5;
        audio.onended = () => {
          setPlayingTrackId(null);
          audioRef.current = null;
        };
        audio.onerror = () => {
          console.error('Error playing audio');
          setPlayingTrackId(null);
          audioRef.current = null;
        };
        
        audioRef.current = audio;
        await audio.play();
        setPlayingTrackId(track.id);
      }
    } catch (error) {
      console.error('Error playing preview:', error);
      setPlayingTrackId(null);
    }
  };

  const handleSelectTrack = (track: MusicTrack) => {
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingTrackId(null);
    }

    if (selectedTrack?.id === track.id) {
      // Deselect
      onSelectTrack(null);
    } else {
      onSelectTrack(track);
    }
  };

  const getMoodEmoji = (mood: string | null) => {
    switch (mood) {
      case 'inspiring': return '🚀';
      case 'chill': return '😌';
      case 'dramatic': return '🎬';
      case 'upbeat': return '🎉';
      default: return '🎵';
    }
  };

  if (loading) {
    return (
      <GlassCard variant="subtle" style={styles.container}>
        <View style={styles.header}>
          <Music size={20} color={DarkTheme.colors.primary} />
          <Text style={styles.title}>Background Music</Text>
        </View>
        <ActivityIndicator size="small" color={DarkTheme.colors.primary} />
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="subtle" style={styles.container}>
      <View style={styles.header}>
        <Music size={20} color={DarkTheme.colors.primary} />
        <Text style={styles.title}>Background Music</Text>
        {selectedTrack && (
          <View style={styles.selectedBadge}>
            <Check size={12} color={DarkTheme.colors.success} />
          </View>
        )}
      </View>

      {/* No music option */}
      <TouchableOpacity
        style={[
          styles.trackItem,
          !selectedTrack && styles.trackItemSelected,
        ]}
        onPress={() => onSelectTrack(null)}
      >
        <View style={styles.trackInfo}>
          <Text style={styles.trackEmoji}>🔇</Text>
          <View>
            <Text style={styles.trackName}>No Music</Text>
            <Text style={styles.trackDescription}>Silent timelapse</Text>
          </View>
        </View>
        {!selectedTrack && (
          <Check size={18} color={DarkTheme.colors.primary} />
        )}
      </TouchableOpacity>

      {/* Music tracks */}
      {tracks.map((track) => (
        <TouchableOpacity
          key={track.id}
          style={[
            styles.trackItem,
            selectedTrack?.id === track.id && styles.trackItemSelected,
          ]}
          onPress={() => handleSelectTrack(track)}
        >
          <View style={styles.trackInfo}>
            <Text style={styles.trackEmoji}>{getMoodEmoji(track.mood)}</Text>
            <View style={styles.trackDetails}>
              <Text style={styles.trackName}>{track.name}</Text>
              <Text style={styles.trackDescription}>
                {track.description || track.mood || 'Background music'}
              </Text>
            </View>
          </View>

          <View style={styles.trackActions}>
            {Platform.OS === 'web' && (
              <TouchableOpacity
                style={styles.playButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handlePlayPreview(track);
                }}
              >
                {playingTrackId === track.id ? (
                  <Pause size={16} color={DarkTheme.colors.primary} />
                ) : (
                  <Play size={16} color={DarkTheme.colors.primary} />
                )}
              </TouchableOpacity>
            )}
            {selectedTrack?.id === track.id && (
              <Check size={18} color={DarkTheme.colors.primary} />
            )}
          </View>
        </TouchableOpacity>
      ))}

      {tracks.length === 0 && (
        <Text style={styles.noTracks}>No music tracks available</Text>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    flex: 1,
  },
  selectedBadge: {
    backgroundColor: `${DarkTheme.colors.success}20`,
    padding: 4,
    borderRadius: DarkTheme.borderRadius.full,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DarkTheme.spacing.sm,
    borderRadius: DarkTheme.borderRadius.md,
    marginBottom: DarkTheme.spacing.xs,
    backgroundColor: DarkTheme.colors.surface,
  },
  trackItemSelected: {
    backgroundColor: `${DarkTheme.colors.primary}15`,
    borderWidth: 1,
    borderColor: `${DarkTheme.colors.primary}40`,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
    flex: 1,
  },
  trackEmoji: {
    fontSize: 24,
  },
  trackDetails: {
    flex: 1,
  },
  trackName: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  trackDescription: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  trackActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${DarkTheme.colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noTracks: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    padding: DarkTheme.spacing.md,
  },
});

