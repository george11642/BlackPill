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
  Modal,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { 
  Menu, 
  Plus, 
  Send, 
  X, 
  MessageSquare, 
  Trash2, 
  Sparkles,
  ChevronRight,
  Bot,
  User,
} from 'lucide-react-native';
import { apiGet, apiPost, apiDelete } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { useSubscription } from '../lib/subscription/context';
import { GlassCard } from '../components/GlassCard';
import { BackHeader } from '../components/BackHeader';
import { LockedFeatureOverlay } from '../components/LockedFeatureOverlay';
import { DarkTheme } from '../lib/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

interface RouteParams {
  metric?: string;
  tip?: string;
  tipDescription?: string;
  tipTimeframe?: string;
}

const QUICK_PROMPTS = [
  { icon: '✨', label: 'Glow up tips', prompt: 'What are the best daily habits for a natural glow and radiant skin?' },
  { icon: '💄', label: 'Makeup advice', prompt: 'What makeup techniques will enhance my natural features?' },
  { icon: '💇', label: 'Hair styling', prompt: 'What hairstyle would best frame my face and bring out my best features?' },
  { icon: '🧴', label: 'Skincare routine', prompt: 'Give me a complete skincare routine for healthy, glowing skin.' },
  { icon: '💅', label: 'Beauty sleep', prompt: 'How can better sleep habits improve my skin and overall appearance?' },
  { icon: '🌸', label: 'Face yoga', prompt: 'What facial exercises can help define my cheekbones naturally?' },
];

export function AICoachScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const params = (route.params as RouteParams) || {};
  const { session } = useAuth();
  const { canAccessFeature } = useSubscription();
  const canChat = canAccessFeature('aiCoach');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState<number | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const hasAutoSentRef = useRef(false);

  useEffect(() => {
    loadConversations();
  }, []);

  // Auto-send message from route params (only once on mount)
  useEffect(() => {
    // Only run if we have params, haven't auto-sent yet, no messages exist,
    // conversations are loaded, and user has access
    if (
      (params.tip || params.metric) &&
      !hasAutoSentRef.current &&
      messages.length === 0 &&
      !loadingConversations && // Wait for conversations to finish loading
      canChat
    ) {
      hasAutoSentRef.current = true;

      let autoMessage = '';

      if (params.tip && params.tipDescription) {
        autoMessage = `I want to work on this improvement tip: "${params.tip}". The suggestion was: "${params.tipDescription}" with a timeframe of "${params.tipTimeframe || 'a few weeks'}". Can you give me a detailed action plan to achieve this?`;
      } else if (params.metric) {
        const metricLabels: Record<string, string> = {
          femininity: 'facial femininity and structure',
          skin: 'skin quality and texture',
          jawline: 'jawline definition',
          cheekbones: 'cheekbone prominence',
          eyes: 'eye area appearance',
          symmetry: 'facial symmetry',
          lips: 'lip shape and fullness',
          hair: 'hair quality and styling',
        };
        autoMessage = `I want to improve my ${metricLabels[params.metric] || params.metric}. What specific steps can I take to see real improvement in this area?`;
      }

      if (autoMessage) {
        // Clear route params to prevent re-triggering
        (navigation as any).setParams({});

        // Send message after a short delay to ensure component is ready
        // Use cleanup to prevent memory leak if component unmounts
        const timer = setTimeout(() => sendMessageWithContent(autoMessage), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [canChat, loadingConversations]); // Wait for both subscription and conversations

  useEffect(() => {
    if (sidebarVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: -300,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [sidebarVisible]);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const data = await apiGet<{ conversations: Conversation[] }>(
        '/api/ai-coach/conversations',
        session?.access_token
      );
      
      setConversations(data.conversations || []);
      // Don't auto-load last conversation - always start fresh with the welcome screen
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const selectConversation = async (conv: Conversation) => {
    try {
      setConversationId(conv.id);
      setSidebarVisible(false);
      
      const data = await apiGet<{ messages: Array<{ id: string; role: string; content: string; created_at?: string; createdAt?: string }> }>(
        `/api/ai-coach/messages?conversationId=${conv.id}`,
        session?.access_token
      );
      
      const mappedMessages: Message[] = (data.messages || []).map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: msg.createdAt || msg.created_at || new Date().toISOString(),
      }));
      
      setMessages(mappedMessages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setMessages([]);
    }
  };

  const startNewConversation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConversationId(null);
    setMessages([]);
    setSidebarVisible(false);
  };

  const deleteConversation = async (convId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await apiDelete(`/api/ai-coach/conversations/${convId}`, session?.access_token);
      setConversations(prev => prev.filter(c => c.id !== convId));
      
      if (conversationId === convId) {
        setConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const sendMessageWithContent = async (messageContent: string) => {
    if (!messageContent.trim() || loading) return;
    
    // Check subscription access before sending
    if (!canChat) {
      Alert.alert(
        'AI Coach Locked',
        'Upgrade to Pro or Elite to chat with your personal AI coach.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'View Plans', 
            onPress: () => navigation.navigate('Subscription' as never)
          }
        ]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiPost<{ reply: string; conversationId: string; remainingMessages: number }>(
        '/api/ai-coach/chat',
        { conversationId: conversationId || undefined, message: messageContent.trim() },
        session?.access_token
      );
      
      if (response.conversationId && !conversationId) {
        setConversationId(response.conversationId);
        // Refresh conversations list
        loadConversations();
      }
      
      setRemainingMessages(response.remainingMessages);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        createdAt: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => sendMessageWithContent(input);

  const handleQuickPrompt = (prompt: string) => {
    // Check subscription access before sending
    if (!canChat) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'AI Coach Locked',
        'Upgrade to Pro or Elite to chat with your personal AI coach.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'View Plans', 
            onPress: () => navigation.navigate('Subscription' as never)
          }
        ]
      );
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendMessageWithContent(prompt);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (!item) return null;
    const isUser = item.role === 'user';
    
    return (
      <View key={item.id} style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[DarkTheme.colors.primary, DarkTheme.colors.primaryLight]}
              style={styles.avatar}
            >
              <Bot size={16} color={DarkTheme.colors.background} />
            </LinearGradient>
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.content}
          </Text>
        </View>
        {isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.userAvatar}>
              <User size={16} color={DarkTheme.colors.text} />
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={[DarkTheme.colors.primary, DarkTheme.colors.primaryLight]}
        style={styles.emptyIcon}
      >
        <Sparkles size={32} color={DarkTheme.colors.background} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>Your AI Looksmaxxing Coach</Text>
      <Text style={styles.emptySubtitle}>
        Get personalized advice on skincare, grooming, fitness, and more to reach your potential.
      </Text>
      
      <Text style={styles.quickPromptsTitle}>Quick prompts</Text>
      <View style={styles.quickPrompts}>
        {QUICK_PROMPTS.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.quickPromptCard,
              !canChat && styles.quickPromptCardLocked
            ]}
            onPress={() => handleQuickPrompt(item.prompt)}
            activeOpacity={canChat ? 0.7 : 1}
            disabled={!canChat}
          >
            <Text style={styles.quickPromptIcon}>{item.icon}</Text>
            <Text style={[
              styles.quickPromptLabel,
              !canChat && styles.quickPromptLabelLocked
            ]}>{item.label}</Text>
            <ChevronRight size={14} color={!canChat ? DarkTheme.colors.textDisabled : DarkTheme.colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // If user can't chat, show locked screen
  if (!canChat) {
    return (
      <View style={styles.container}>
        <BackHeader 
          title="AI Coach"
          variant="large"
        />
        <View style={styles.lockedContainer}>
          <LockedFeatureOverlay 
            isVisible={true} 
            title="AI Coach Locked" 
            description="Upgrade to Pro or Elite to chat with your personal AI coach."
            showCloseButton={false}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <BackHeader 
        title="AI Coach"
        variant="large"
        rightElement={
          <View style={styles.headerRightButtons}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={startNewConversation}
            >
              <Plus size={24} color={DarkTheme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSidebarVisible(true);
              }}
            >
              <Menu size={24} color={DarkTheme.colors.text} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Remaining messages indicator */}
      {remainingMessages !== null && remainingMessages < 10 && (
        <View style={styles.remainingBanner}>
          <Text style={styles.remainingText}>
            {remainingMessages} messages remaining today
          </Text>
        </View>
      )}

      {/* Main chat area */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 ? (
          <ScrollView 
            contentContainerStyle={styles.emptyScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderEmptyState()}
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item?.id || Math.random().toString()}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input area */}
        <View style={styles.inputWrapper}>
          <View style={[styles.inputContainer, !canChat && styles.inputContainerLocked]}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask your coach anything..."
              placeholderTextColor={DarkTheme.colors.textTertiary}
              multiline
              maxLength={1000}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color={DarkTheme.colors.background} />
              ) : (
                <Send size={20} color={DarkTheme.colors.background} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Sidebar Modal */}
      <Modal
        visible={sidebarVisible}
        transparent
        animationType="none"
        onRequestClose={() => setSidebarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSidebarVisible(false)}
          />
          <Animated.View 
            style={[
              styles.sidebar,
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Conversations</Text>
              <TouchableOpacity onPress={() => setSidebarVisible(false)}>
                <X size={24} color={DarkTheme.colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.newConversationButton}
              onPress={startNewConversation}
            >
              <LinearGradient
                colors={[DarkTheme.colors.primary, DarkTheme.colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.newConversationGradient}
              >
                <Plus size={20} color={DarkTheme.colors.background} />
                <Text style={styles.newConversationText}>New conversation</Text>
              </LinearGradient>
            </TouchableOpacity>

            {loadingConversations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
              </View>
            ) : (
              <ScrollView style={styles.conversationsList} showsVerticalScrollIndicator={false}>
                {conversations.length === 0 ? (
                  <View style={styles.noConversations}>
                    <MessageSquare size={32} color={DarkTheme.colors.textTertiary} />
                    <Text style={styles.noConversationsText}>No conversations yet</Text>
                  </View>
                ) : (
                  conversations.map((conv) => (
                    <TouchableOpacity
                      key={conv.id}
                      style={[
                        styles.conversationItem,
                        conversationId === conv.id && styles.conversationItemActive
                      ]}
                      onPress={() => selectConversation(conv)}
                    >
                      <View style={styles.conversationContent}>
                        <MessageSquare size={18} color={DarkTheme.colors.textSecondary} />
                        <View style={styles.conversationInfo}>
                          <Text style={styles.conversationTitle} numberOfLines={1}>
                            {conv.title || 'New conversation'}
                          </Text>
                          <Text style={styles.conversationDate}>
                            {formatDate(conv.updated_at || conv.created_at)}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deleteConversation(conv.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 size={16} color={DarkTheme.colors.error} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
  },
  headerButton: {
    padding: DarkTheme.spacing.sm,
  },
  remainingBanner: {
    backgroundColor: DarkTheme.colors.warning + '20',
    paddingVertical: DarkTheme.spacing.xs,
    paddingHorizontal: DarkTheme.spacing.md,
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 12,
    color: DarkTheme.colors.warning,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: DarkTheme.spacing.md,
    paddingBottom: DarkTheme.spacing.xl,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: DarkTheme.spacing.md,
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginHorizontal: DarkTheme.spacing.xs,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DarkTheme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: DarkTheme.spacing.md,
    paddingVertical: DarkTheme.spacing.sm,
    borderRadius: DarkTheme.borderRadius.lg,
  },
  userBubble: {
    backgroundColor: DarkTheme.colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: DarkTheme.colors.card,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    lineHeight: 22,
  },
  userMessageText: {
    color: DarkTheme.colors.background,
  },
  emptyScrollContent: {
    flexGrow: 1,
    paddingTop: DarkTheme.spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: DarkTheme.spacing.xl,
    paddingBottom: 20,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DarkTheme.spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: DarkTheme.spacing.lg,
  },
  quickPromptsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.md,
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickPrompts: {
    width: '100%',
  },
  quickPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkTheme.colors.card,
    paddingVertical: DarkTheme.spacing.md,
    paddingHorizontal: DarkTheme.spacing.md,
    borderRadius: DarkTheme.borderRadius.md,
    marginBottom: DarkTheme.spacing.sm,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
  },
  quickPromptCardLocked: {
    opacity: 0.5,
    borderColor: DarkTheme.colors.borderSubtle + '80',
  },
  quickPromptIcon: {
    fontSize: 20,
    marginRight: DarkTheme.spacing.md,
  },
  quickPromptLabel: {
    flex: 1,
    fontSize: 15,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  quickPromptLabelLocked: {
    color: DarkTheme.colors.textDisabled,
  },
  inputWrapper: {
    padding: DarkTheme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 90 : 80,
    borderTopWidth: 1,
    borderTopColor: DarkTheme.colors.borderSubtle,
    backgroundColor: DarkTheme.colors.background,
    position: 'relative',
  },
  lockedContainer: {
    flex: 1,
    position: 'relative',
  },
  lockedOverlay: {
    borderRadius: DarkTheme.borderRadius.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  inputContainerLocked: {
    opacity: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: DarkTheme.colors.card,
    borderRadius: DarkTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
    paddingHorizontal: DarkTheme.spacing.sm,
    paddingVertical: DarkTheme.spacing.xs,
  },
  input: {
    flex: 1,
    paddingHorizontal: DarkTheme.spacing.sm,
    paddingVertical: DarkTheme.spacing.sm,
    color: DarkTheme.colors.text,
    fontSize: 15,
    fontFamily: DarkTheme.typography.fontFamily,
    maxHeight: 120,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DarkTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: DarkTheme.colors.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: DarkTheme.colors.background,
    borderRightWidth: 1,
    borderRightColor: DarkTheme.colors.borderSubtle,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DarkTheme.spacing.md,
    paddingTop: 50,
    paddingBottom: DarkTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.colors.borderSubtle,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  newConversationButton: {
    margin: DarkTheme.spacing.md,
  },
  newConversationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DarkTheme.spacing.md,
    borderRadius: DarkTheme.borderRadius.md,
    gap: DarkTheme.spacing.sm,
  },
  newConversationText: {
    fontSize: 15,
    fontWeight: '600',
    color: DarkTheme.colors.background,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationsList: {
    flex: 1,
    paddingHorizontal: DarkTheme.spacing.sm,
  },
  noConversations: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DarkTheme.spacing.xl,
  },
  noConversationsText: {
    fontSize: 14,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: DarkTheme.spacing.sm,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DarkTheme.spacing.md,
    paddingHorizontal: DarkTheme.spacing.sm,
    borderRadius: DarkTheme.borderRadius.md,
    marginBottom: DarkTheme.spacing.xs,
  },
  conversationItemActive: {
    backgroundColor: DarkTheme.colors.card,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  conversationInfo: {
    marginLeft: DarkTheme.spacing.sm,
    flex: 1,
  },
  conversationTitle: {
    fontSize: 14,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 2,
  },
  conversationDate: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  deleteButton: {
    padding: DarkTheme.spacing.sm,
  },
});
