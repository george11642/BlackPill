import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { apiGet, apiPost } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { DarkTheme } from '../lib/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export function AICoachScreen() {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConversation();
  }, []);

  const loadConversation = async () => {
    try {
      const data = await apiGet<{ messages: Message[] }>(
        '/api/ai-coach/messages',
        session?.access_token
      );
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiPost<{ message: Message }>(
        '/api/ai-coach/chat',
        { message: input.trim() },
        session?.access_token
      );
      setMessages((prev) => [...prev, response.message]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.role === 'user' ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      <GlassCard style={styles.messageCard}>
        <Text style={styles.messageText}>{item.content}</Text>
      </GlassCard>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.title}>AI Coach</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your AI coach..."
          placeholderTextColor={DarkTheme.colors.textTertiary}
          multiline
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={loading || !input.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  header: {
    padding: DarkTheme.spacing.lg,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  messages: {
    padding: DarkTheme.spacing.md,
  },
  messageContainer: {
    marginBottom: DarkTheme.spacing.md,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageCard: {
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 14,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: DarkTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DarkTheme.colors.border,
    backgroundColor: DarkTheme.colors.card,
  },
  input: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
    borderRadius: DarkTheme.borderRadius.md,
    paddingHorizontal: DarkTheme.spacing.md,
    paddingVertical: DarkTheme.spacing.sm,
    color: DarkTheme.colors.text,
    fontSize: 14,
    fontFamily: DarkTheme.typography.fontFamily,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: DarkTheme.spacing.md,
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingVertical: DarkTheme.spacing.sm,
    backgroundColor: DarkTheme.colors.primary,
    borderRadius: DarkTheme.borderRadius.md,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: DarkTheme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: DarkTheme.typography.fontFamily,
  },
});

