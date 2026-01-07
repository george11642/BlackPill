import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, Slider, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { BlurView } from 'expo-blur';
import { DarkTheme } from '../lib/theme';
import { PhotoVerificationResult } from '../lib/types';

interface CameraOverlayProps {
  onVerificationChange: (result: PhotoVerificationResult) => void;
  isActive: boolean;
  baselinePhotoUrl?: string;
}

export function CameraOverlay({ onVerificationChange, isActive, baselinePhotoUrl }: CameraOverlayProps) {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [isAligned, setIsAligned] = useState(false);
  const [feedback, setFeedback] = useState('Hold phone upright');
  const [ghostOpacity, setGhostOpacity] = useState(0.3);

  useEffect(() => {
    if (!isActive) return;

    // Skip accelerometer verification on web - it's unreliable in browsers
    if (Platform.OS === 'web') {
      setIsAligned(true);
      setFeedback('Ready to capture');
      onVerificationChange({
        isAligned: true,
        isStable: true,
        pitch: 0,
        roll: 0,
        overallValid: true,
        feedback: 'Ready to capture',
      });
      return;
    }

    let subscription: any;

    const startAccelerometer = async () => {
      try {
        const isAvailable = await Accelerometer.isAvailableAsync();
        if (isAvailable) {
          Accelerometer.setUpdateInterval(200);
          subscription = Accelerometer.addListener(accelerometerData => {
            setData(accelerometerData);
            validatePosition(accelerometerData);
          });
        } else {
          // If sensors not available (e.g. desktop web), assume aligned
          setIsAligned(true);
          setFeedback('Perfect!');
          onVerificationChange({
            isAligned: true,
            isStable: true,
            pitch: 0,
            roll: 0,
            overallValid: true,
            feedback: 'Perfect!',
          });
        }
      } catch (error) {
        console.log('Accelerometer error:', error);
        // Fallback for error case
        setIsAligned(true);
      }
    };

    startAccelerometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isActive]);

  const validatePosition = ({ x, y, z }: { x: number; y: number; z: number }) => {
    // Ideally, for a portrait selfie:
    // x (left/right tilt) should be close to 0
    // y (forward/back tilt) should be close to 0 (vertical) or slightly positive/negative depending on how held
    // Note: Expo Accelerometer values are -1 to 1 (g-force)
    
    // Simple check for holding phone upright in portrait
    // When held upright: x ~ 0, y ~ 1 (or -1 depending on implementation/OS), z ~ 0
    
    const roll = Math.atan2(x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
    const pitch = Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);

    // Tolerances
    const ROLL_TOLERANCE = 10; // degrees
    const PITCH_TARGET = 90; // roughly upright
    const PITCH_TOLERANCE = 15;

    const isRollGood = Math.abs(roll) < ROLL_TOLERANCE;
    // Pitch check can be tricky depending on device orientation constants, 
    // but usually we just want it "stable" and not flat on a table.
    // Let's focus on "not tilted sideways" (roll) heavily, and reasonable upright-ness.
    
    // Simplified upright check: abs(y) should be > 0.7 (meaning mostly vertical gravity)
    const isUpright = Math.abs(y) > 0.7;

    const aligned = isRollGood && isUpright;
    setIsAligned(aligned);

    let feedbackText = 'Perfect!';
    if (!isUpright) {
      feedbackText = 'Hold phone upright';
    } else if (!isRollGood) {
      feedbackText = roll > 0 ? 'Tilt left' : 'Tilt right';
    }

    setFeedback(feedbackText);

    onVerificationChange({
      isAligned: aligned,
      isStable: true, // assuming stable if getting updates (could use magnitude delta)
      pitch,
      roll,
      overallValid: aligned,
      feedback: feedbackText,
    });
  };

  if (!isActive) return null;

  const { width, height } = Dimensions.get('window');
  const maskWidth = width * 0.8;
  const maskHeight = height * 0.5;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Ghost Image Overlay */}
      {baselinePhotoUrl && (
        <View style={[StyleSheet.absoluteFill, { opacity: ghostOpacity, zIndex: 5 }]}>
          <Image 
            source={{ uri: baselinePhotoUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Dimmed Background with Cutout */}
      <View style={styles.maskContainer}>
        <View style={[styles.maskRow, { height: (height - maskHeight) / 2 - 50 }]} />
        <View style={styles.maskMiddle}>
          <View style={[styles.maskCol, { width: (width - maskWidth) / 2 }]} />
          <View style={[styles.cutout, { width: maskWidth, height: maskHeight, borderColor: isAligned ? DarkTheme.colors.success : DarkTheme.colors.warning }]} />
          <View style={[styles.maskCol, { width: (width - maskWidth) / 2 }]} />
        </View>
        <View style={[styles.maskRow, { flex: 1 }]} />
      </View>

      {/* Feedback Card */}
      <View style={styles.feedbackContainer}>
        <BlurView intensity={80} tint="dark" style={styles.feedbackCard}>
          <View style={[styles.indicator, { backgroundColor: isAligned ? DarkTheme.colors.success : DarkTheme.colors.warning }]} />
          <Text style={styles.feedbackText}>{feedback}</Text>
        </BlurView>
      </View>

      {/* Grid Lines (Optional visual aid) */}
      {isAligned && (
        <View style={styles.gridLines}>
           <View style={[styles.crosshair, { top: height / 2 - 10, left: width / 2 - 1 }]} />
           <View style={[styles.crosshair, { top: height / 2 - 1, left: width / 2 - 10, width: 20, height: 2 }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  maskContainer: {
    flex: 1,
  },
  maskRow: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: '100%',
  },
  maskMiddle: {
    flexDirection: 'row',
  },
  maskCol: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    height: '100%',
  },
  cutout: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderRadius: 200, // Oval shape
    borderStyle: 'dashed',
  },
  feedbackContainer: {
    position: 'absolute',
    top: 60, // Below header
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  feedbackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  gridLines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshair: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
  }
});

