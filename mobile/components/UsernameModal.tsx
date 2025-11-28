import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { DarkTheme } from '../lib/theme';
import { PrimaryButton } from './PrimaryButton';

interface UsernameModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (username: string) => Promise<void>;
  isLoading?: boolean;
}

export function UsernameModal({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}: UsernameModalProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (username.length > 30) {
      setError('Username must be 30 characters or less');
      return;
    }

    // Check for valid characters (alphanumeric, underscores, periods)
    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      setError('Username can only contain letters, numbers, dots, and underscores');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onSubmit(username);
      setUsername('');
    } catch (err: any) {
      setError(err.message || 'Failed to set username');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setUsername('');
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Create Username</Text>
              <TouchableOpacity
                onPress={handleClose}
                disabled={submitting}
                style={styles.closeButton}
              >
                <X size={24} color={DarkTheme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.description}>
                Choose a username to join the leaderboard. Your photo and best score will be visible to other users.
              </Text>

              <TextInput
                style={[
                  styles.input,
                  error ? styles.inputError : {},
                  submitting ? styles.inputDisabled : {},
                ]}
                placeholder="Enter username"
                placeholderTextColor={DarkTheme.colors.placeholder}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setError('');
                }}
                editable={!submitting}
                maxLength={30}
              />

              <Text style={styles.characterCount}>
                {username.length}/30 characters
              </Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Text style={styles.hint}>
                • 3-30 characters
              </Text>
              <Text style={styles.hint}>
                • Letters, numbers, dots, underscores
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  submitting ? styles.buttonDisabled : {},
                ]}
                onPress={handleClose}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <PrimaryButton
                title={submitting ? 'Creating...' : 'Create & Join'}
                onPress={handleSubmit}
                disabled={submitting || !username.trim()}
                size="md"
                style={styles.submitButton}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalView: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: DarkTheme.colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: DarkTheme.colors.text,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  content: {
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    marginBottom: 16,
  },
  input: {
    backgroundColor: DarkTheme.colors.input,
    borderWidth: 1,
    borderColor: DarkTheme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: DarkTheme.colors.text,
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  inputDisabled: {
    opacity: 0.5,
  },
  characterCount: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    marginBottom: 12,
    textAlign: 'right',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    marginBottom: 12,
  },
  hint: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DarkTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: DarkTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

