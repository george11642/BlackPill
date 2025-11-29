import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as FaceDetector from 'expo-face-detector';
import { useAuth } from '../lib/auth/context';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackHeader } from '../components/BackHeader';
import { GlassCard } from '../components/GlassCard';
import { CameraOverlay } from '../components/CameraOverlay';
import { DarkTheme } from '../lib/theme';
import { PhotoVerificationResult } from '../lib/types';
import { notifyAchievementUnlocked } from '../lib/achievements/events';

export function CameraScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { session } = useAuth();
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<PhotoVerificationResult | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check context from route params
  const params = route.params as { 
    context?: 'challenge_check_in' | 'analysis';
    challengeId?: string;
    baselinePhotoUrl?: string;
    onCapture?: (uri: string) => void;
  } || {};
  
  // Enable verification for both challenge check-ins and normal analysis
  const useVerification = true; // Always enable verification for better quality/consistency

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContent}>
          <LinearGradient
            colors={[DarkTheme.colors.primaryDark, DarkTheme.colors.card]}
            style={styles.iconContainer}
          >
            <Camera size={56} color={DarkTheme.colors.primary} />
          </LinearGradient>
          
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          
          <Text style={styles.permissionDescription}>
            To analyze your facial features and get your beauty score, we need access to your camera.
          </Text>

          <GlassCard style={styles.benefitsCard}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📸</Text>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Take Photos</Text>
                <Text style={styles.benefitText}>Capture selfies for analysis</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🔍</Text>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>AI Analysis</Text>
                <Text style={styles.benefitText}>Get instant beauty scores</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📊</Text>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Track Progress</Text>
                <Text style={styles.benefitText}>Monitor your improvements</Text>
              </View>
            </View>
          </GlassCard>

          <PrimaryButton 
            title="Grant Camera Access" 
            onPress={requestPermission}
            style={styles.permissionButton}
          />
          
          <Text style={styles.privacyNote}>
            Your camera is only used when you take a photo. We don't store or access your camera without permission.
          </Text>
        </View>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;

    if (useVerification && verificationResult && !verificationResult.overallValid) {
      Alert.alert('Adjust Position', verificationResult.feedback);
      return;
    }

    try {
      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo) {
        // Perform client-side face detection checks (skip on web - FaceDetector not supported)
        if (useVerification && Platform.OS !== 'web') {
          try {
            const faces = await FaceDetector.detectFacesAsync(photo.uri, {
              mode: FaceDetector.FaceDetectorMode.accurate,
              detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
              runClassifications: FaceDetector.FaceDetectorClassifications.all,
            });

            if (faces.faces.length === 0) {
              setLoading(false);
              Alert.alert('No Face Detected', 'Please ensure your face is clearly visible in the frame.');
              return;
            }

            if (faces.faces.length > 1) {
              setLoading(false);
              Alert.alert('Multiple Faces', 'Please ensure only one face is in the frame.');
              return;
            }

            const face = faces.faces[0];
            const { yawAngle, rollAngle } = face;
            
            if (Math.abs(yawAngle) > 20) {
               setLoading(false);
               Alert.alert('Adjust Angle', 'Please face the camera directly (turn head ' + (yawAngle > 0 ? 'left' : 'right') + ').');
               return;
            }
            
            if (Math.abs(rollAngle) > 20) {
               setLoading(false);
               Alert.alert('Adjust Angle', 'Please keep your head straight (tilt head ' + (rollAngle > 0 ? 'right' : 'left') + ').');
               return;
            }
          } catch (faceError) {
            // Face detection failed, continue without it
            console.log('Face detection not available:', faceError);
          }
        }

        setCapturedPhoto(photo.uri);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to take photo');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as ImagePicker.MediaTypeOptions,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedPhoto(result.assets[0].uri);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleContinue = async () => {
    if (capturedPhoto) {
      if (params.context === 'challenge_check_in' && params.onCapture) {
        // If in check-in context, pass photo back
        params.onCapture(capturedPhoto);
        navigation.goBack();
      } else {
        // Default analysis flow
        await analyzePhoto(capturedPhoto);
      }
    }
  };

  const handleBack = () => {
    if (loading) {
      Alert.alert(
        'Cancel Analysis?',
        'Are you sure you want to cancel the analysis? Your progress will be lost.',
        [
          {
            text: 'Continue Analysis',
            style: 'cancel',
          },
          {
            text: 'Cancel',
            style: 'destructive',
            onPress: () => {
              // Abort any ongoing requests
              if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
              }
              setLoading(false);
              if (capturedPhoto) {
                setCapturedPhoto(null);
              } else {
                (navigation as any).goBack();
              }
            },
          },
        ]
      );
    } else {
      if (capturedPhoto) {
        setCapturedPhoto(null);
      } else {
        (navigation as any).goBack();
      }
    }
  };

  const analyzePhoto = async (uri: string) => {
    setLoading(true);
    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();
    
    try {
      console.log('[CameraScreen] Starting analysis for URI:', uri);
      
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        // On web, the URI is a blob URL or data URL - we need to fetch it and create a Blob
        console.log('[CameraScreen] Web platform - converting URI to blob');
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('image', blob, 'photo.jpg');
        console.log('[CameraScreen] Blob created with size:', blob.size);
      } else {
        // React Native specific: append file as an object with uri, type, name
        // This is the correct way to upload files in React Native
        formData.append('image', {
          uri: uri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        } as any);
      }

      console.log('[CameraScreen] FormData created with image');

      // Use fetch directly to support abort signal
      const APP_URL = Constants.expoConfig?.extra?.appUrl || process.env.EXPO_PUBLIC_APP_URL || 'https://black-pill.app';
      console.log('[CameraScreen] Sending to:', `${APP_URL}/api/analyze`);
      
      const analysisResponse = await fetch(`${APP_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          // Don't set Content-Type - let fetch set it automatically with boundary
        },
        signal: abortControllerRef.current.signal,
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${analysisResponse.status}`);
      }

      const analysisData = await analysisResponse.json();

      // Trigger achievement notifications if any were unlocked
      if (analysisData.unlocked_achievements && analysisData.unlocked_achievements.length > 0) {
        // Delay slightly so the navigation happens first
        setTimeout(() => {
          analysisData.unlocked_achievements.forEach((achievement: any) => {
            notifyAchievementUnlocked({
              key: achievement.key,
              name: achievement.name,
              emoji: achievement.emoji,
              description: achievement.description,
            });
          });
        }, 500);
      }

      // Only navigate if not aborted
      if (!abortControllerRef.current.signal.aborted) {
        (navigation as any).navigate('AnalysisResult', {
          analysisId: analysisData.analysis_id,
        });
      }
    } catch (error: any) {
      // Don't show error if it was aborted
      if (!abortControllerRef.current?.signal.aborted && error.name !== 'AbortError') {
        Alert.alert('Analysis Failed', error.message || 'Please try again');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Show preview screen if photo is captured
  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <BackHeader title="Review Photo" variant="large" onBackPress={handleBack} />
        <View style={styles.previewHeader}>
          <Text style={styles.previewSubtitle}>Make sure everything looks good</Text>
        </View>
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: capturedPhoto }}
            style={styles.previewImage}
            resizeMode="cover"
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
              <Text style={styles.loadingText}>Analyzing...</Text>
            </View>
          )}
        </View>
        <View style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.previewButton, styles.retakeButton]}
            onPress={handleRetake}
            disabled={loading}
          >
            <Text style={[styles.previewButtonText, styles.retakeButtonText]}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.previewButton, styles.continueButton]}
            onPress={handleContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.previewButtonText, styles.continueButtonText]}>
                {params.context === 'challenge_check_in' ? 'Use Photo' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <BackHeader title="Take Photo" variant="large" onBackPress={handleBack} />
      </View>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      />
      
      {/* Challenge Verification Overlay */}
      {useVerification && (
        <CameraOverlay 
          isActive={!capturedPhoto}
          onVerificationChange={setVerificationResult}
          baselinePhotoUrl={params.baselinePhotoUrl}
        />
      )}

      {/* Controls overlay - positioned absolutely outside CameraView */}
      <View style={styles.overlay}>
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.button}
            onPress={pickImage}
            disabled={loading}
          >
            <Text style={styles.buttonText}>📁</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              useVerification && verificationResult && !verificationResult.overallValid && styles.captureButtonDisabled
            ]}
            onPress={takePicture}
            disabled={loading}
          >
            <View style={[
              styles.captureInner,
              useVerification && verificationResult && !verificationResult.overallValid && styles.captureInnerDisabled
            ]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
            disabled={loading}
          >
            <Text style={styles.buttonText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  camera: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: DarkTheme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 24,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DarkTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: DarkTheme.colors.text,
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: DarkTheme.colors.text,
  },
  captureButtonDisabled: {
    borderColor: DarkTheme.colors.textTertiary,
    opacity: 0.5,
  },
  captureInnerDisabled: {
    backgroundColor: DarkTheme.colors.textTertiary,
  },
  text: {
    color: DarkTheme.colors.text,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  // Permission Screen Styles
  permissionContent: {
    flex: 1,
    paddingHorizontal: DarkTheme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  permissionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.md,
  },
  permissionDescription: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.xl,
    lineHeight: 24,
  },
  benefitsCard: {
    marginBottom: DarkTheme.spacing.xl,
    width: '100%',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DarkTheme.spacing.md,
    gap: DarkTheme.spacing.md,
  },
  benefitIcon: {
    fontSize: 28,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 2,
  },
  benefitText: {
    fontSize: 13,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  divider: {
    height: 1,
    backgroundColor: DarkTheme.colors.borderSubtle,
    marginVertical: 0,
  },
  permissionButton: {
    width: '100%',
    marginBottom: DarkTheme.spacing.lg,
  },
  privacyNote: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: '90%',
  },
  previewHeader: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  previewSubtitle: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  previewContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: DarkTheme.colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: DarkTheme.colors.text,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  previewButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButton: {
    backgroundColor: DarkTheme.colors.card,
    borderWidth: 1,
    borderColor: DarkTheme.colors.textSecondary,
  },
  continueButton: {
    backgroundColor: DarkTheme.colors.primary,
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  retakeButtonText: {
    color: DarkTheme.colors.text,
  },
  continueButtonText: {
    color: '#fff',
  },
});
