import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Camera, User, X } from 'lucide-react-native';
import { TextInput } from './TextInput';
import { DarkTheme } from '../lib/theme';

export interface ProfileSetupData {
  username: string;
  avatarUri: string | null;
}

interface ProfileSetupStepProps {
  data: ProfileSetupData;
  onUpdate: (data: ProfileSetupData) => void;
}

export function ProfileSetupStep({ data, onUpdate }: ProfileSetupStepProps) {
  const [username, setUsername] = useState(data.username);
  const [avatarUri, setAvatarUri] = useState<string | null>(data.avatarUri);

  const handleUsernameChange = (text: string) => {
    // Only allow alphanumeric and underscores, max 20 chars
    const sanitized = text.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
    setUsername(sanitized);
    onUpdate({ username: sanitized, avatarUri });
  };

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      onUpdate({ username, avatarUri: result.assets[0].uri });
    }
  };

  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      onUpdate({ username, avatarUri: result.assets[0].uri });
    }
  };

  const clearAvatar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAvatarUri(null);
    onUpdate({ username, avatarUri: null });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View entering={FadeIn.duration(500)}>
        <Text style={styles.title}>Set Up Your Profile</Text>
        <Text style={styles.subtitle}>
          Let others know who you are (optional)
        </Text>
      </Animated.View>

      {/* Avatar Section */}
      <Animated.View 
        style={styles.avatarSection}
        entering={FadeIn.delay(200).duration(500)}
      >
        <View style={styles.avatarContainer}>
          {avatarUri ? (
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
              <TouchableOpacity style={styles.clearButton} onPress={clearAvatar}>
                <X size={16} color={DarkTheme.colors.text} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={48} color={DarkTheme.colors.textTertiary} />
            </View>
          )}
        </View>

        <View style={styles.avatarButtons}>
          <TouchableOpacity style={styles.avatarButton} onPress={pickImage}>
            <Text style={styles.avatarButtonText}>Choose Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarButton} onPress={takePhoto}>
            <Camera size={18} color={DarkTheme.colors.primary} />
            <Text style={styles.avatarButtonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Username Section */}
      <Animated.View 
        style={styles.usernameSection}
        entering={FadeIn.delay(400).duration(500)}
      >
        <TextInput
          label="Username"
          value={username}
          onChangeText={handleUsernameChange}
          placeholder="Choose a username"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
        />
        <Text style={styles.usernameHint}>
          Letters, numbers, and underscores only
        </Text>
      </Animated.View>

      <Animated.View 
        style={styles.skipHint}
        entering={FadeIn.delay(600).duration(500)}
      >
        <Text style={styles.skipHintText}>
          You can always update this later in Settings
        </Text>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingTop: DarkTheme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xl,
  },
  avatarContainer: {
    marginBottom: DarkTheme.spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: DarkTheme.colors.primary,
  },
  clearButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DarkTheme.colors.card,
    borderWidth: 2,
    borderColor: DarkTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DarkTheme.colors.card,
    borderWidth: 2,
    borderColor: DarkTheme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: DarkTheme.spacing.md,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: DarkTheme.spacing.sm,
    paddingHorizontal: DarkTheme.spacing.md,
    borderRadius: DarkTheme.borderRadius.md,
    backgroundColor: `${DarkTheme.colors.primary}15`,
    borderWidth: 1,
    borderColor: `${DarkTheme.colors.primary}30`,
  },
  avatarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  usernameSection: {
    marginBottom: DarkTheme.spacing.lg,
  },
  usernameHint: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: DarkTheme.spacing.xs,
    marginLeft: DarkTheme.spacing.xs,
  },
  skipHint: {
    alignItems: 'center',
  },
  skipHintText: {
    fontSize: 13,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    fontStyle: 'italic',
  },
});

export default ProfileSetupStep;

