import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth/context';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextInput } from '../components/TextInput';
import { DarkTheme } from '../lib/theme';

export function LoginScreen() {
  const navigation = useNavigation();
  const { signIn, signInWithGoogle, signInWithApple, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showResetPassword, setShowResetPassword] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // Navigation will happen automatically when user state updates
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please check your credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // Navigation will happen automatically when user state updates
    } catch (error: any) {
      Alert.alert('Google Sign-In Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      await signInWithApple();
      // Navigation will happen automatically when user state updates
    } catch (error: any) {
      if (error.message?.includes('cancelled')) {
        // User cancelled - don't show error
        return;
      }
      Alert.alert('Apple Sign-In Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address first');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      Alert.alert(
        'Password Reset Email Sent',
        'Check your email for a password reset link. The link will expire in 1 hour.',
        [{ text: 'OK', onPress: () => setShowResetPassword(false) }]
      );
    } catch (error: any) {
      Alert.alert('Password Reset Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          {!showResetPassword && (
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              error={errors.password}
            />
          )}

          {!showResetPassword && (
            <Text
              style={styles.forgotPassword}
              onPress={() => setShowResetPassword(true)}
            >
              Forgot Password?
            </Text>
          )}

          {showResetPassword ? (
            <>
              <PrimaryButton
                title="Send Reset Email"
                onPress={handleResetPassword}
                loading={loading}
                style={styles.button}
              />
              <Text
                style={styles.backToLogin}
                onPress={() => setShowResetPassword(false)}
              >
                Back to Sign In
              </Text>
            </>
          ) : (
            <PrimaryButton
              title="Sign In"
              onPress={handleEmailLogin}
              loading={loading}
              style={styles.button}
            />
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <PrimaryButton
            title="Continue with Google"
            onPress={handleGoogleLogin}
            loading={loading}
            variant="secondary"
            style={styles.button}
          />

          <PrimaryButton
            title="Continue with Apple"
            onPress={handleAppleLogin}
            loading={loading}
            variant="secondary"
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Text
              style={styles.footerLink}
              onPress={() => navigation.navigate('Signup' as never)}
            >
              Sign Up
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: DarkTheme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  subtitle: {
    fontSize: DarkTheme.typography.body.fontSize,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: DarkTheme.spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: DarkTheme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: DarkTheme.colors.border,
  },
  dividerText: {
    marginHorizontal: DarkTheme.spacing.md,
    color: DarkTheme.colors.textTertiary,
    fontSize: 12,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: DarkTheme.spacing.lg,
  },
  footerText: {
    color: DarkTheme.colors.textSecondary,
    fontSize: 14,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  footerLink: {
    color: DarkTheme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  forgotPassword: {
    color: DarkTheme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'right',
    marginTop: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.xs,
  },
  backToLogin: {
    color: DarkTheme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginTop: DarkTheme.spacing.md,
  },
});

