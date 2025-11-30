import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MessageCircle, Mail, Globe, HelpCircle, ChevronRight } from 'lucide-react-native';

import { GlassCard } from '../components/GlassCard';
import { BackHeader } from '../components/BackHeader';
import { GradientText } from '../components/GradientText';
import { DarkTheme } from '../lib/theme';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface SupportChannel {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  action: () => void;
}

export function HelpAndSupportScreen() {
  const navigation = useNavigation();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqs: FAQItem[] = [
    {
      id: '1',
      question: 'How accurate is the facial analysis?',
      answer:
        'Our AI-powered facial analysis uses advanced machine learning trained on millions of facial features. While it provides helpful insights, it should be used as a fun tool for self-improvement guidance, not as a medical or scientific assessment.',
    },
    {
      id: '2',
      question: 'How often can I take scans?',
      answer:
        'With our free plan, you get limited scans per month. With a premium subscription, you get unlimited scans and additional features. You can upgrade anytime from your Profile.',
    },
    {
      id: '3',
      question: 'Is my data secure?',
      answer:
        'Yes, we take security seriously. All your data is encrypted and stored securely. We never share your personal information with third parties. See our Privacy & Ethics section for more details.',
    },
    {
      id: '4',
      question: 'How do referrals work?',
      answer:
        'Share your unique referral code with friends. When they sign up and complete their first scan, you both receive bonus scans. There\'s no limit to how many friends you can refer!',
    },
    {
      id: '5',
      question: 'Can I delete my account?',
      answer:
        'Yes, you can request account deletion from the Settings screen. This will permanently delete all your data and cannot be undone. Please contact support if you have any questions.',
    },
  ];

  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: (1 - contentOpacity.value) * 20 }],
  }));

  const handleOpenEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL('mailto:support@blackpill.app?subject=Help%20Request');
  };

  const handleOpenWebsite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const appUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://www.black-pill.app';
    Linking.openURL(`${appUrl}/help`);
  };

  const supportChannels: SupportChannel[] = [
    {
      id: 'email',
      label: 'Email Support',
      description: 'Get help from our support team',
      icon: Mail,
      action: handleOpenEmail,
    },
    {
      id: 'faq',
      label: 'FAQ',
      description: 'Browse common questions',
      icon: HelpCircle,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // FAQ scrolls into view below
      },
    },
    {
      id: 'website',
      label: 'Help Center',
      description: 'Visit our help center online',
      icon: Globe,
      action: handleOpenWebsite,
    },
  ];

  const handleToggleFAQ = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <BackHeader title="Help & Support" variant="large" />
      <View style={styles.content}>

      {/* Support Channels */}
      <Animated.View style={contentAnimatedStyle}>
        <GradientText 
          text="Contact Us"
          fontSize={18}
          fontWeight="700"
          colors={[DarkTheme.colors.primary, DarkTheme.colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sectionTitleGradient}
        />
        <View style={styles.channelsContainer}>
          {supportChannels.map((channel) => {
            const Icon = channel.icon;
            return (
              <TouchableOpacity
                key={channel.id}
                onPress={channel.action}
                activeOpacity={0.7}
              >
                <GlassCard variant="subtle" style={styles.channelCard}>
                  <View style={styles.channelContent}>
                    <View style={styles.channelIcon}>
                      <View style={styles.iconBackground}>
                        <Icon size={22} color={DarkTheme.colors.primary} />
                      </View>
                    </View>
                    <View style={styles.channelText}>
                      <Text style={styles.channelLabel}>{channel.label}</Text>
                      <Text style={styles.channelDescription}>
                        {channel.description}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={DarkTheme.colors.textTertiary} />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* FAQs */}
      <Animated.View style={[styles.faqSection, contentAnimatedStyle]}>
        <GradientText 
          text="Frequently Asked Questions"
          fontSize={18}
          fontWeight="700"
          colors={[DarkTheme.colors.primary, DarkTheme.colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sectionTitleGradient}
        />

        <View style={styles.faqContainer}>
          {faqs.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              onPress={() => handleToggleFAQ(faq.id)}
              activeOpacity={0.7}
            >
              <GlassCard variant="subtle" style={styles.faqItem}>
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Text style={styles.faqToggle}>
                    {expandedFAQ === faq.id ? '−' : '+'}
                  </Text>
                </View>

                {expandedFAQ === faq.id && (
                  <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                )}
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Additional Info */}
      <Animated.View style={[styles.infoBox, contentAnimatedStyle]}>
        <GlassCard variant="subtle">
          <View>
            <Text style={styles.infoTitle}>⏰ Response Time</Text>
            <Text style={styles.infoText}>
              Our support team typically responds within 24 hours. For urgent matters, please indicate priority in your email.
            </Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  content: {
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.md,
  },
  sectionTitleGradient: {
    marginBottom: DarkTheme.spacing.md,
  },
  channelsContainer: {
    gap: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.lg,
  },
  channelCard: {
    marginBottom: 0,
  },
  channelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.md,
  },
  channelIcon: {
    marginRight: DarkTheme.spacing.sm,
  },
  iconBackground: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${DarkTheme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelText: {
    flex: 1,
  },
  channelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 2,
  },
  channelDescription: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  faqSection: {
    marginBottom: DarkTheme.spacing.lg,
  },
  faqContainer: {
    gap: DarkTheme.spacing.md,
  },
  faqItem: {
    marginBottom: 0,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: DarkTheme.spacing.md,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    flex: 1,
    lineHeight: 20,
  },
  faqToggle: {
    fontSize: 20,
    color: DarkTheme.colors.primary,
    fontWeight: '600',
  },
  faqAnswerContainer: {
    marginTop: DarkTheme.spacing.md,
    paddingTop: DarkTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DarkTheme.colors.borderSubtle,
  },
  faqAnswer: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    lineHeight: 20,
  },
  infoBox: {
    marginBottom: DarkTheme.spacing.lg,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  infoText: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default HelpAndSupportScreen;

