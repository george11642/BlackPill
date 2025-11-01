import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';

/// Provider for AI conversations
final aiConversationsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final apiService = ref.read(apiServiceProvider);
  return await apiService.getAIConversations();
});

/// Provider for conversation messages
final aiMessagesProvider = FutureProvider.family.autoDispose<List<dynamic>, String>((ref, conversationId) async {
  final apiService = ref.read(apiServiceProvider);
  return await apiService.getAIMessages(conversationId);
});

class AICoachScreen extends ConsumerStatefulWidget {
  final String? conversationId;

  const AICoachScreen({
    super.key,
    this.conversationId,
  });

  @override
  ConsumerState<AICoachScreen> createState() => _AICoachScreenState();
}

class _AICoachScreenState extends ConsumerState<AICoachScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  String? _currentConversationId;
  bool _isLoading = false;
  int? _remainingMessages;

  final List<String> _quickQuestions = [
    'How to improve jawline?',
    'Best skincare routine?',
    'Mewing tips?',
    'How to fix asymmetry?',
    'Diet for better skin?',
  ];

  @override
  void initState() {
    super.initState();
    _currentConversationId = widget.conversationId;
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final message = _messageController.text.trim();
    if (message.isEmpty || _isLoading) return;

    setState(() {
      _isLoading = true;
      _messageController.clear();
    });

    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.sendAICoachMessage(
        conversationId: _currentConversationId,
        message: message,
      );

      setState(() {
        _currentConversationId = response['conversationId'];
        _remainingMessages = response['remainingMessages'];
        _isLoading = false;
      });

      // Refresh messages
      if (_currentConversationId != null) {
        ref.invalidate(aiMessagesProvider(_currentConversationId!));
      }

      // Scroll to bottom
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to send message: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.deepBlack,
      appBar: AppBar(
        title: const Text('AI Coach'),
        backgroundColor: AppColors.darkGray,
        actions: [
          if (_remainingMessages != null)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Center(
                child: Text(
                  '$_remainingMessages left',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // Quick questions
          if (_currentConversationId == null)
            Container(
              padding: const EdgeInsets.all(16),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _quickQuestions.map((question) {
                  return ActionChip(
                    label: Text(question),
                    onPressed: () {
                      _messageController.text = question;
                      _sendMessage();
                    },
                    backgroundColor: AppColors.darkGray,
                    labelStyle: TextStyle(color: AppColors.textPrimary),
                  );
                }).toList(),
              ),
            ),

          // Messages
          Expanded(
            child: _currentConversationId == null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.chat_bubble_outline,
                          size: 64,
                          color: AppColors.textTertiary,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Ask me anything about looksmaxxing!',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  )
                : _buildMessagesList(),
          ),

          // Input area
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.darkGray,
              border: Border(
                top: BorderSide(color: AppColors.glassBorder),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    style: TextStyle(color: AppColors.textPrimary),
                    decoration: InputDecoration(
                      hintText: 'Ask a question...',
                      hintStyle: TextStyle(color: AppColors.textTertiary),
                      filled: true,
                      fillColor: AppColors.charcoal,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                    ),
                    maxLines: null,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: _isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Icon(
                          Icons.send,
                          color: AppColors.neonPink,
                        ),
                  onPressed: _isLoading ? null : _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessagesList() {
    if (_currentConversationId == null) return const SizedBox.shrink();

    final messagesAsync = ref.watch(aiMessagesProvider(_currentConversationId!));

    return messagesAsync.when(
      data: (messages) => ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(16),
        itemCount: messages.length + (_isLoading ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == messages.length) {
            return const Padding(
              padding: EdgeInsets.all(8.0),
              child: Center(child: CircularProgressIndicator()),
            );
          }

          final message = messages[index];
          final isUser = message['role'] == 'user';

          return Align(
            alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
            child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.75,
              ),
              decoration: BoxDecoration(
                color: isUser ? AppColors.neonPink : AppColors.darkGray,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                message['content'] ?? '',
                style: TextStyle(
                  color: isUser ? Colors.white : AppColors.textPrimary,
                  fontSize: 14,
                ),
              ),
            ),
          );
        },
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(
        child: Text(
          'Error: $error',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      ),
    );
  }
}

