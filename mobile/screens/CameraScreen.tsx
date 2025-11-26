import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { apiPost } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { PrimaryButton } from '../components/PrimaryButton';
import { DarkTheme } from '../lib/theme';

export function CameraScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission is required</Text>
        <PrimaryButton title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;

    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo) {
        await analyzePhoto(photo.uri);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to take photo');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await analyzePhoto(result.assets[0].uri);
    }
  };

  const analyzePhoto = async (uri: string) => {
    setLoading(true);
    try {
      // Convert image to base64 or upload to storage first
      const formData = new FormData();
      formData.append('photo', {
        uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);

      const response = await apiPost<{ analysisId: string }>(
        '/api/analyze',
        formData,
        session?.access_token
      );

      navigation.navigate('AnalysisResult' as never, {
        analysisId: response.analysisId,
      } as never);
    } catch (error: any) {
      Alert.alert('Analysis Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
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
              style={styles.captureButton}
              onPress={takePicture}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={DarkTheme.colors.text} />
              ) : (
                <View style={styles.captureInner} />
              )}
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
      </CameraView>
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
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
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
  text: {
    color: DarkTheme.colors.text,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
  },
});

