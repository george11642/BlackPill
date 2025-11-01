# BlackPill Phase 2, 2.5 & 2.6 Implementation Guide

## 📋 Document Overview

This guide provides **step-by-step instructions** for implementing all Phase 2, Phase 2.5, and Phase 2.6 features added to BlackPill v1.3 PRD. These features are based on competitive analysis of leading looksmaxxing apps (Umaxx, LookMax AI, Maxxing, Alpha Aura) plus advanced differentiation strategies to create a 10-year competitive moat through transparency, ethical design, and wellness integration.

**Target Agent:** Any AI coding assistant or developer team  
**Prerequisites:** BlackPill v1.0 fully deployed (authentication, analysis, subscriptions, referrals working)  
**Total Timeline:** 20 weeks (5 months)  
**Total Investment:** $58,500  
**Expected ROI:** 246x over 12 months (+$10.8M ARR)

---

## 🎯 Implementation Priorities

### Phase 2 (Weeks 5-8): Quick Wins - Daily Engagement
**Focus:** Boost DAU/MAU from 40% → 65%+

1. **F7: Custom Routines System** (3 weeks, $12K) ⭐⭐⭐⭐⭐
2. **F8: Before/After Comparison** (1 week, $2K) ⭐⭐⭐⭐⭐  
3. **F9: Daily Check-In Streaks** (3 days, $600) ⭐⭐⭐⭐⭐
4. **F10: Achievement Badges** (4 days, $800) ⭐⭐⭐⭐
5. **F11: Photo History Gallery** (3 days, $600) ⭐⭐⭐⭐

### Phase 2.5 (Weeks 9-16): Engagement & Monetization
**Focus:** Increase subscription conversion 15% → 22%+, add revenue streams

6. **F12: AI Chat Coach** (2 weeks, $4K) ⭐⭐⭐⭐⭐
7. **F13: Goal Setting & Tracking** (1.5 weeks, $3K) ⭐⭐⭐⭐⭐
8. **F14: Enhanced Push Notifications** (1 week, $2K) ⭐⭐⭐⭐
9. **F15: Product Marketplace** (2 weeks, $4K) ⭐⭐⭐⭐
10. **F16: Personalized Insights** (1.5 weeks, $3K) ⭐⭐⭐⭐

### Phase 2.6 (Weeks 13-20): Advanced Differentiation
**Focus:** Build 10-year competitive moat, increase conversion 22% → 28%+, reduce churn to <2%

11. **F17: Transparent Scoring** (1 week, $2K) ⭐⭐⭐⭐⭐ **CRITICAL**
12. **F18: 3-Tier Action Plans** (1 week, $2K) ⭐⭐⭐⭐⭐
13. **F19: Structured Challenges** (1.5 weeks, $3K) ⭐⭐⭐⭐⭐
14. **F20: Ethical Guardrails** (3 days, $500) ⭐⭐⭐⭐⭐ **URGENT**
15. **F21: Wearable Integration** (2 weeks, $4K) ⭐⭐⭐⭐

---

## 🗂️ Project Structure

All new features will be added to the existing BlackPill structure:

```
BlackPill/
├── backend/
│   ├── api/
│   │   ├── routines/          # NEW - F7
│   │   ├── comparisons/        # NEW - F8
│   │   ├── checkins/           # NEW - F9
│   │   ├── achievements/       # NEW - F10
│   │   ├── ai-coach/           # NEW - F12
│   │   ├── goals/              # NEW - F13
│   │   ├── products/           # NEW - F15
│   │   └── insights/           # NEW - F16
│   ├── lib/
│   │   └── features/
│   │       ├── routines/       # NEW - Business logic
│   │       ├── achievements/   # NEW
│   │       ├── ai-coach/       # NEW
│   │       └── insights/       # NEW
│   └── utils/
│       └── notification-scheduler.js  # ENHANCED - F14
├── mobile/
│   └── lib/
│       ├── screens/
│       │   ├── routine_builder_screen.dart     # NEW - F7
│       │   ├── routine_checklist_screen.dart   # NEW - F7
│       │   ├── comparison_screen.dart          # NEW - F8
│       │   ├── achievements_screen.dart        # NEW - F10
│       │   ├── photo_history_screen.dart       # NEW - F11
│       │   ├── ai_coach_screen.dart            # NEW - F12
│       │   ├── goals_screen.dart               # NEW - F13
│       │   ├── marketplace_screen.dart         # NEW - F15
│       │   └── insights_dashboard_screen.dart  # NEW - F16
│       ├── widgets/
│       │   ├── streak_widget.dart              # NEW - F9
│       │   ├── achievement_card.dart           # NEW - F10
│       │   ├── routine_task_item.dart          # NEW - F7
│       │   └── ... (many more)
│       └── providers/
│           ├── routine_provider.dart           # NEW - F7
│           ├── achievement_provider.dart       # NEW - F10
│           ├── ai_coach_provider.dart          # NEW - F12
│           └── ... (more)
└── supabase/
    └── migrations/
        ├── 20251030000001_create_routines_tables.sql       # NEW - F7
        ├── 20251030000002_create_checkins_table.sql        # NEW - F9
        ├── 20251030000003_create_achievements_table.sql    # NEW - F10
        ├── 20251030000004_create_ai_coach_tables.sql       # NEW - F12
        ├── 20251030000005_create_goals_tables.sql          # NEW - F13
        ├── 20251030000006_create_notification_prefs.sql    # NEW - F14
        ├── 20251030000007_create_products_tables.sql       # NEW - F15
        └── 20251030000008_create_insights_table.sql        # NEW - F16
```

---

## 🛠️ Feature-by-Feature Implementation

---

## F7: CUSTOM ROUTINES SYSTEM (3 weeks, Priority 1)

### Overview
AI-generated personalized improvement routines with daily task tracking, streak mechanics, and analytics correlation.

### Database Migration (Step 1)

Create file: `supabase/migrations/20251030000001_create_routines_tables.sql`

```sql
-- Routines table
CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  focus_categories TEXT[], -- ['skin', 'jawline', 'overall']
  is_active BOOLEAN DEFAULT true,
  created_from_analysis_id UUID REFERENCES analyses(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine tasks
CREATE TABLE routine_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'skincare', 'grooming', 'fitness', 'nutrition', 'mewing'
  time_of_day TEXT[], -- ['morning', 'evening']
  frequency TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly'
  specific_days INT[], -- [1,3,5] for Mon/Wed/Fri, NULL for daily
  order_index INT NOT NULL DEFAULT 0,
  is_timed BOOLEAN DEFAULT false,
  duration_minutes INT,
  product_name TEXT,
  product_link TEXT,
  why_it_helps TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Completion tracking
CREATE TABLE routine_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES routine_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  skipped BOOLEAN DEFAULT false,
  notes TEXT
);

-- Streak tracking
CREATE TABLE routine_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_completed_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(routine_id, user_id)
);

-- Indexes
CREATE INDEX idx_routines_user_active ON routines(user_id, is_active);
CREATE INDEX idx_routine_tasks_routine ON routine_tasks(routine_id, order_index);
CREATE INDEX idx_routine_completions_user_date ON routine_completions(user_id, completed_at);
CREATE INDEX idx_routine_completions_task ON routine_completions(task_id);
CREATE INDEX idx_routine_streaks_user ON routine_streaks(user_id);

-- RLS Policies
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own routines" ON routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own routines" ON routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own routines" ON routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own routines" ON routines FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users see tasks for own routines" ON routine_tasks FOR SELECT 
  USING (EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_tasks.routine_id AND routines.user_id = auth.uid()));

CREATE POLICY "Users see own completions" ON routine_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own completions" ON routine_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users see own streaks" ON routine_streaks FOR SELECT USING (auth.uid() = user_id);
```

Run migration:
```bash
cd supabase
npx supabase db push
```

### Backend API (Step 2)

Create `backend/api/routines/generate.js`:

```javascript
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, analysisId, focusAreas, timeCommitment, preferences } = req.body;

  try {
    // Get analysis data
    const { data: analysis } = await supabase
      .from('analyses')
      .select('score, breakdown')
      .eq('id', analysisId)
      .single();

    // Identify weak areas
    const breakdown = analysis.breakdown;
    const weakAreas = Object.entries(breakdown)
      .filter(([key, value]) => value < 7.0)
      .map(([key]) => key);

    // Generate routine with AI
    const prompt = `Create a personalized looksmaxxing routine for someone with:
- Overall score: ${analysis.score}/10
- Weak areas: ${weakAreas.join(', ')}
- Focus goals: ${focusAreas.join(', ')}
- Daily time commitment: ${timeCommitment} minutes
- Preferences: ${JSON.stringify(preferences)}

Generate a daily routine with 8-12 specific, actionable tasks organized by time of day (morning/evening).
For each task, include:
- Title (concise, e.g., "Apply Sunscreen")
- Description (specific instructions)
- Category (skincare/grooming/fitness/nutrition/mewing)
- Time of day (morning/evening or both)
- Duration in minutes
- Why it helps (scientific benefit)
- Product suggestion (optional, real product name)

Format as JSON array of tasks.
Be constructive and avoid toxic terminology.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a supportive looksmaxxing coach. Generate practical, evidence-based routines. Be specific and actionable.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const generatedRoutine = JSON.parse(completion.choices[0].message.content);

    // Create routine in database
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .insert({
        user_id: userId,
        name: `${focusAreas.join(' & ')} Improvement Plan`,
        goal: `Improve ${focusAreas.join(', ')}`,
        focus_categories: focusAreas,
        created_from_analysis_id: analysisId,
        is_active: true
      })
      .select()
      .single();

    if (routineError) throw routineError;

    // Insert tasks
    const tasks = generatedRoutine.tasks.map((task, index) => ({
      routine_id: routine.id,
      title: task.title,
      description: task.description,
      category: task.category,
      time_of_day: task.time_of_day,
      frequency: task.frequency || 'daily',
      order_index: index,
      duration_minutes: task.duration_minutes,
      why_it_helps: task.why_it_helps,
      product_name: task.product_name || null,
      product_link: task.product_link || null
    }));

    const { data: insertedTasks, error: tasksError } = await supabase
      .from('routine_tasks')
      .insert(tasks)
      .select();

    if (tasksError) throw tasksError;

    // Initialize streak
    await supabase
      .from('routine_streaks')
      .insert({
        routine_id: routine.id,
        user_id: userId,
        current_streak: 0,
        longest_streak: 0
      });

    return res.status(200).json({
      routine: {
        ...routine,
        tasks: insertedTasks
      }
    });

  } catch (error) {
    console.error('Routine generation error:', error);
    return res.status(500).json({ error: 'Failed to generate routine' });
  }
}
```

Create `backend/api/routines/complete-task.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateStreak(routineId, userId) {
  const today = new Date().toISOString().split('T')[0];
  
  // Get tasks for today
  const { data: todaysTasks } = await supabase
    .from('routine_tasks')
    .select('id')
    .eq('routine_id', routineId);

  // Count completed tasks today
  const { data: completedToday } = await supabase
    .from('routine_completions')
    .select('task_id')
    .eq('routine_id', routineId)
    .eq('user_id', userId)
    .gte('completed_at', `${today}T00:00:00Z`)
    .lt('completed_at', `${today}T23:59:59Z`);

  const completionRate = completedToday.length / todaysTasks.length;

  // Consider day complete if 70%+ tasks done
  if (completionRate >= 0.7) {
    const { data: currentStreak } = await supabase
      .from('routine_streaks')
      .select('current_streak, longest_streak, last_completed_date')
      .eq('routine_id', routineId)
      .eq('user_id', userId)
      .single();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak;
    if (currentStreak.last_completed_date === yesterdayStr) {
      // Continuing streak
      newStreak = currentStreak.current_streak + 1;
    } else if (currentStreak.last_completed_date === today) {
      // Already completed today
      newStreak = currentStreak.current_streak;
    } else {
      // Streak broken, start fresh
      newStreak = 1;
    }

    const newLongest = Math.max(newStreak, currentStreak.longest_streak);

    await supabase
      .from('routine_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_completed_date: today,
        updated_at: new Date().toISOString()
      })
      .eq('routine_id', routineId)
      .eq('user_id', userId);

    // Award milestone bonuses
    if (newStreak === 7) {
      await awardBonus(userId, 5, '7_day_routine_streak');
    } else if (newStreak === 30) {
      await awardBonus(userId, 10, '30_day_routine_streak');
    } else if (newStreak === 90) {
      await grantFreeTier(userId, 'pro', 30);
    }

    return newStreak;
  }

  return null;
}

async function awardBonus(userId, scans, achievementKey) {
  // Add scans
  await supabase
    .from('users')
    .update({ scans_remaining: supabase.rpc('increment', { x: scans }) })
    .eq('id', userId);

  // Track achievement
  await supabase
    .from('user_achievements')
    .insert({
      user_id: userId,
      achievement_key: achievementKey,
      unlocked_at: new Date().toISOString()
    })
    .onConflict('user_id,achievement_key')
    .ignore();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { taskId, routineId, userId, skipped, notes } = req.body;

  try {
    // Record completion
    const { data, error } = await supabase
      .from('routine_completions')
      .insert({
        task_id: taskId,
        routine_id: routineId,
        user_id: userId,
        skipped: skipped || false,
        notes: notes || null
      })
      .select()
      .single();

    if (error) throw error;

    // Update streak
    const newStreak = await updateStreak(routineId, userId);

    return res.status(200).json({
      completion: data,
      newStreak
    });

  } catch (error) {
    console.error('Task completion error:', error);
    return res.status(500).json({ error: 'Failed to complete task' });
  }
}
```

Create additional API endpoints:
- `backend/api/routines/list.js` - Get user's routines
- `backend/api/routines/tasks.js` - Get tasks for a routine
- `backend/api/routines/today.js` - Get today's tasks
- `backend/api/routines/stats.js` - Get completion stats
- `backend/api/routines/update.js` - Update routine
- `backend/api/routines/delete.js` - Delete routine

### Mobile UI (Step 3)

Create `mobile/lib/screens/routine_builder_screen.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class RoutineBuilderScreen extends ConsumerStatefulWidget {
  final String analysisId;

  const RoutineBuilderScreen({required this.analysisId});

  @override
  ConsumerState<RoutineBuilderScreen> createState() => _RoutineBuilderScreenState();
}

class _RoutineBuilderScreenState extends ConsumerState<RoutineBuilderScreen> {
  Set<String> selectedGoals = {};
  String timeCommitment = 'medium'; // short, medium, long
  bool isGenerating = false;

  final List<Map<String, dynamic>> goalOptions = [
    {'key': 'skin', 'label': 'Skin Quality', 'icon': Icons.face},
    {'key': 'jawline', 'label': 'Jawline Definition', 'icon': Icons.accessibility_new},
    {'key': 'symmetry', 'label': 'Facial Symmetry', 'icon': Icons.balance},
    {'key': 'grooming', 'label': 'Overall Grooming', 'icon': Icons.cut},
    {'key': 'fitness', 'label': 'Fitness & Body', 'icon': Icons.fitness_center},
  ];

  Future<void> generateRoutine() async {
    if (selectedGoals.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please select at least one goal')),
      );
      return;
    }

    setState(() => isGenerating = true);

    try {
      final routine = await ref.read(apiServiceProvider).generateRoutine(
        analysisId: widget.analysisId,
        focusAreas: selectedGoals.toList(),
        timeCommitment: timeCommitment,
      );

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => RoutineChecklistScreen(routineId: routine['id']),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to generate routine: $e')),
      );
    } finally {
      setState(() => isGenerating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Build Your Routine'),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'What do you want to improve?',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            SizedBox(height: 16),
            ...goalOptions.map((goal) => GoalCard(
              label: goal['label'],
              icon: goal['icon'],
              isSelected: selectedGoals.contains(goal['key']),
              onTap: () {
                setState(() {
                  if (selectedGoals.contains(goal['key'])) {
                    selectedGoals.remove(goal['key']);
                  } else {
                    selectedGoals.add(goal['key']);
                  }
                });
              },
            )),
            SizedBox(height: 32),
            Text(
              'Daily time commitment',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            SizedBox(height: 12),
            SegmentedButton<String>(
              segments: [
                ButtonSegment(value: 'short', label: Text('10-15 min')),
                ButtonSegment(value: 'medium', label: Text('20-30 min')),
                ButtonSegment(value: 'long', label: Text('45+ min')),
              ],
              selected: {timeCommitment},
              onSelectionChanged: (Set<String> newSelection) {
                setState(() => timeCommitment = newSelection.first);
              },
            ),
            SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: isGenerating ? null : generateRoutine,
                child: isGenerating
                    ? CircularProgressIndicator()
                    : Text('Generate My Routine'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class GoalCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const GoalCard({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 12),
      color: isSelected ? Theme.of(context).primaryColor.withOpacity(0.2) : null,
      child: ListTile(
        leading: Icon(icon, color: isSelected ? Theme.of(context).primaryColor : null),
        title: Text(label),
        trailing: isSelected ? Icon(Icons.check_circle, color: Theme.of(context).primaryColor) : null,
        onTap: onTap,
      ),
    );
  }
}
```

Create `mobile/lib/screens/routine_checklist_screen.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class RoutineChecklistScreen extends ConsumerWidget {
  final String routineId;

  const RoutineChecklistScreen({required this.routineId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final routine = ref.watch(routineProvider(routineId));

    return routine.when(
      data: (data) => Scaffold(
        appBar: AppBar(
          title: Text(data['name']),
          actions: [
            IconButton(
              icon: Icon(Icons.edit),
              onPressed: () {
                // Navigate to edit routine
              },
            ),
          ],
        ),
        body: SingleChildScrollView(
          child: Column(
            children: [
              // Streak widget
              StreakWidget(
                streakCount: data['streak']['current_streak'],
                longestStreak: data['streak']['longest_streak'],
              ),
              
              // Morning tasks
              TaskSection(
                title: 'Morning Routine',
                tasks: data['tasks'].where((t) => t['time_of_day'].contains('morning')).toList(),
                routineId: routineId,
              ),
              
              // Evening tasks
              TaskSection(
                title: 'Evening Routine',
                tasks: data['tasks'].where((t) => t['time_of_day'].contains('evening')).toList(),
                routineId: routineId,
              ),
              
              // All-day tasks
              TaskSection(
                title: 'Throughout the Day',
                tasks: data['tasks'].where((t) => !t['time_of_day'].contains('morning') && !t['time_of_day'].contains('evening')).toList(),
                routineId: routineId,
              ),
            ],
          ),
        ),
      ),
      loading: () => Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (error, stack) => Scaffold(body: Center(child: Text('Error: $error'))),
    );
  }
}

class StreakWidget extends StatelessWidget {
  final int streakCount;
  final int longestStreak;

  const StreakWidget({required this.streakCount, required this.longestStreak});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.all(16),
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.orange.shade400, Colors.red.shade400],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(Icons.local_fire_department, size: 48, color: Colors.white),
          SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$streakCount Day Streak!',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'Longest: $longestStreak days',
                  style: TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class TaskSection extends StatelessWidget {
  final String title;
  final List<dynamic> tasks;
  final String routineId;

  const TaskSection({
    required this.title,
    required this.tasks,
    required this.routineId,
  });

  @override
  Widget build(BuildContext context) {
    if (tasks.isEmpty) return SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.fromLTRB(16, 24, 16, 12),
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ),
        ...tasks.map((task) => RoutineTaskItem(
          task: task,
          routineId: routineId,
        )),
      ],
    );
  }
}

class RoutineTaskItem extends ConsumerStatefulWidget {
  final Map<String, dynamic> task;
  final String routineId;

  const RoutineTaskItem({required this.task, required this.routineId});

  @override
  ConsumerState<RoutineTaskItem> createState() => _RoutineTaskItemState();
}

class _RoutineTaskItemState extends ConsumerState<RoutineTaskItem> {
  bool isCompleted = false;

  Future<void> toggleComplete() async {
    setState(() => isCompleted = !isCompleted);

    try {
      await ref.read(apiServiceProvider).completeTask(
        taskId: widget.task['id'],
        routineId: widget.routineId,
        skipped: false,
      );
    } catch (e) {
      setState(() => isCompleted = !isCompleted);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update task')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: CheckboxListTile(
        value: isCompleted,
        onChanged: (bool? value) => toggleComplete(),
        title: Text(widget.task['title']),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (widget.task['description'] != null)
              Text(widget.task['description']),
            SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.access_time, size: 14, color: Colors.grey),
                SizedBox(width: 4),
                Text(
                  '${widget.task['duration_minutes']} min',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
                SizedBox(width: 12),
                Chip(
                  label: Text(widget.task['category']),
                  labelStyle: TextStyle(fontSize: 10),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
          ],
        ),
        isThreeLine: true,
      ),
    );
  }
}
```

### Testing Checklist (Step 4)

- [ ] Database migrations run successfully
- [ ] Can generate routine from analysis
- [ ] Tasks appear organized by time of day
- [ ] Can mark tasks complete
- [ ] Streak updates correctly
- [ ] Bonus scans awarded at milestones (7, 30, 90 days)
- [ ] RLS policies prevent unauthorized access
- [ ] UI handles loading/error states
- [ ] Performance: routine generation < 5 seconds

---

## F8: BEFORE/AFTER COMPARISON (1 week, Priority 2)

### Overview
Side-by-side photo comparison showing score deltas and category improvements.

### Database (Step 1)

Create `supabase/migrations/20251030000002_create_comparison_view.sql`:

```sql
-- Create view for easy comparisons
CREATE VIEW analysis_comparisons AS
SELECT 
  a1.id as before_id,
  a1.user_id,
  a1.image_url as before_image,
  a1.image_thumbnail_url as before_thumbnail,
  a1.score as before_score,
  a1.breakdown as before_breakdown,
  a1.created_at as before_date,
  a2.id as after_id,
  a2.image_url as after_image,
  a2.image_thumbnail_url as after_thumbnail,
  a2.score as after_score,
  a2.breakdown as after_breakdown,
  a2.created_at as after_date,
  (a2.score - a1.score) as score_delta,
  EXTRACT(DAY FROM (a2.created_at - a1.created_at)) as days_between
FROM analyses a1
CROSS JOIN analyses a2
WHERE a1.user_id = a2.user_id
  AND a1.created_at < a2.created_at
  AND a1.deleted_at IS NULL
  AND a2.deleted_at IS NULL;

-- Grant access
GRANT SELECT ON analysis_comparisons TO authenticated;
```

### Backend API (Step 2)

Create `backend/api/comparisons/compare.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function calculateBreakdownDeltas(beforeBreakdown, afterBreakdown) {
  const deltas = {};
  for (const [key, value] of Object.entries(afterBreakdown)) {
    deltas[key] = {
      before: beforeBreakdown[key],
      after: value,
      delta: value - beforeBreakdown[key],
      percentChange: ((value / beforeBreakdown[key] - 1) * 100).toFixed(1)
    };
  }
  return deltas;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { beforeId, afterId, userId } = req.query;

  try {
    const { data: comparison, error } = await supabase
      .from('analysis_comparisons')
      .select('*')
      .eq('before_id', beforeId)
      .eq('after_id', afterId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const breakdownDeltas = calculateBreakdownDeltas(
      comparison.before_breakdown,
      comparison.after_breakdown
    );

    // Get active routine during this period (if any)
    const { data: routines } = await supabase
      .from('routines')
      .select('*, routine_streaks(*)')
      .eq('user_id', userId)
      .lte('created_at', comparison.after_date)
      .gte('created_at', comparison.before_date);

    let routineCompliance = null;
    if (routines && routines.length > 0) {
      // Calculate average compliance
      const { data: completions } = await supabase
        .from('routine_completions')
        .select('completed_at')
        .eq('user_id', userId)
        .gte('completed_at', comparison.before_date)
        .lte('completed_at', comparison.after_date);

      const totalDays = comparison.days_between;
      const completedDays = new Set(completions.map(c => 
        new Date(c.completed_at).toISOString().split('T')[0]
      )).size;

      routineCompliance = ((completedDays / totalDays) * 100).toFixed(0);
    }

    return res.status(200).json({
      comparison: {
        ...comparison,
        breakdownDeltas,
        routineCompliance,
        improvements: Object.entries(breakdownDeltas)
          .filter(([key, data]) => data.delta > 0)
          .map(([key, data]) => ({ category: key, ...data })),
        declines: Object.entries(breakdownDeltas)
          .filter(([key, data]) => data.delta < 0)
          .map(([key, data]) => ({ category: key, ...data }))
      }
    });

  } catch (error) {
    console.error('Comparison error:', error);
    return res.status(500).json({ error: 'Failed to generate comparison' });
  }
}
```

### Mobile UI (Step 3)

Create `mobile/lib/screens/comparison_screen.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ComparisonScreen extends ConsumerStatefulWidget {
  const ComparisonScreen();

  @override
  ConsumerState<ComparisonScreen> createState() => _ComparisonScreenState();
}

class _ComparisonScreenState extends ConsumerState<ComparisonScreen> {
  String? selectedBeforeId;
  String? selectedAfterId;

  @override
  Widget build(BuildContext context) {
    final analyses = ref.watch(analysesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Compare Progress'),
      ),
      body: analyses.when(
        data: (data) {
          if (data.length < 2) {
            return Center(
              child: Text('You need at least 2 analyses to compare'),
            );
          }

          return Column(
            children: [
              // Date selectors
              Padding(
                padding: EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: DateSelector(
                        label: 'Before',
                        analyses: data,
                        selectedId: selectedBeforeId,
                        onSelect: (id) => setState(() => selectedBeforeId = id),
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12),
                      child: Icon(Icons.arrow_forward, size: 32),
                    ),
                    Expanded(
                      child: DateSelector(
                        label: 'After',
                        analyses: data,
                        selectedId: selectedAfterId,
                        onSelect: (id) => setState(() => selectedAfterId = id),
                      ),
                    ),
                  ],
                ),
              ),

              // Comparison view
              if (selectedBeforeId != null && selectedAfterId != null)
                Expanded(
                  child: ComparisonView(
                    beforeId: selectedBeforeId!,
                    afterId: selectedAfterId!,
                  ),
                )
              else
                Expanded(
                  child: Center(
                    child: Text('Select two analyses to compare'),
                  ),
                ),
            ],
          );
        },
        loading: () => Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Error: $error')),
      ),
    );
  }
}

class ComparisonView extends ConsumerWidget {
  final String beforeId;
  final String afterId;

  const ComparisonView({required this.beforeId, required this.afterId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final comparison = ref.watch(comparisonProvider(beforeId, afterId));

    return comparison.when(
      data: (data) => SingleChildScrollView(
        child: Column(
          children: [
            // Side-by-side images
            Padding(
              padding: EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: ComparisonImage(
                      imageUrl: data['before_image'],
                      score: data['before_score'],
                      date: data['before_date'],
                      label: 'Before',
                    ),
                  ),
                  SizedBox(width: 16),
                  Expanded(
                    child: ComparisonImage(
                      imageUrl: data['after_image'],
                      score: data['after_score'],
                      date: data['after_date'],
                      label: 'After',
                    ),
                  ),
                ],
              ),
            ),

            // Score delta card
            ScoreDeltaCard(
              scoreDelta: data['score_delta'],
              daysBetween: data['days_between'],
              percentChange: ((data['after_score'] / data['before_score'] - 1) * 100).toStringAsFixed(1),
            ),

            // Category improvements
            Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Category Changes',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  SizedBox(height: 12),
                  ...data['breakdownDeltas'].entries.map((entry) {
                    final category = entry.key;
                    final delta = entry.value;
                    return ImprovementRow(
                      category: category,
                      before: delta['before'],
                      after: delta['after'],
                      delta: delta['delta'],
                    );
                  }),
                ],
              ),
            ),

            // Routine compliance (if applicable)
            if (data['routineCompliance'] != null)
              Card(
                margin: EdgeInsets.all(16),
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, color: Colors.green),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Routine completed ${data['routineCompliance']}% during this period',
                          style: TextStyle(fontSize: 16),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // Share button
            Padding(
              padding: EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton.icon(
                  icon: Icon(Icons.share),
                  label: Text('Share My Progress'),
                  onPressed: () {
                    // Generate and share comparison card
                  },
                ),
              ),
            ),
          ],
        ),
      ),
      loading: () => Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(child: Text('Error: $error')),
    );
  }
}

class ScoreDeltaCard extends StatelessWidget {
  final double scoreDelta;
  final int daysBetween;
  final String percentChange;

  const ScoreDeltaCard({
    required this.scoreDelta,
    required this.daysBetween,
    required this.percentChange,
  });

  @override
  Widget build(BuildContext context) {
    final isPositive = scoreDelta > 0;
    final color = isPositive ? Colors.green : Colors.red;
    final icon = isPositive ? Icons.trending_up : Icons.trending_down;

    return Container(
      margin: EdgeInsets.all(16),
      padding: EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isPositive 
            ? [Colors.green.shade400, Colors.teal.shade400]
            : [Colors.red.shade400, Colors.orange.shade400],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(icon, size: 48, color: Colors.white),
          SizedBox(height: 12),
          Text(
            '${scoreDelta > 0 ? '+' : ''}${scoreDelta.toStringAsFixed(1)}',
            style: TextStyle(
              fontSize: 48,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          Text(
            '${isPositive ? '+' : ''}$percentChange% improvement',
            style: TextStyle(fontSize: 18, color: Colors.white),
          ),
          SizedBox(height: 8),
          Text(
            '$daysBetween days between photos',
            style: TextStyle(fontSize: 14, color: Colors.white70),
          ),
        ],
      ),
    );
  }
}

class ImprovementRow extends StatelessWidget {
  final String category;
  final double before;
  final double after;
  final double delta;

  const ImprovementRow({
    required this.category,
    required this.before,
    required this.after,
    required this.delta,
  });

  @override
  Widget build(BuildContext context) {
    final isPositive = delta > 0;
    final icon = delta > 0.5 
      ? Icons.check_circle 
      : delta > 0 
        ? Icons.trending_up 
        : delta < -0.5 
          ? Icons.warning 
          : Icons.trending_down;
    
    final color = delta > 0 ? Colors.green : delta < 0 ? Colors.red : Colors.grey;

    return Card(
      margin: EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: EdgeInsets.all(12),
        child: Row(
          children: [
            Icon(icon, color: color),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    category.toUpperCase(),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    '${before.toStringAsFixed(1)} → ${after.toStringAsFixed(1)}',
                    style: TextStyle(fontSize: 16),
                  ),
                ],
              ),
            ),
            Text(
              '${delta > 0 ? '+' : ''}${delta.toStringAsFixed(1)}',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### Testing Checklist (Step 4)

- [ ] Can select any two analyses for comparison
- [ ] Images display side-by-side correctly
- [ ] Score delta calculates accurately
- [ ] Category deltas show improvements/declines
- [ ] Routine compliance displays when applicable
- [ ] Share functionality works
- [ ] Performance: comparison loads < 1 second

---

## F9-F11: Quick Wins

*Note: F9 (Daily Streaks), F10 (Achievement Badges), and F11 (Photo History Gallery) follow similar patterns to F7 and F8. Each requires database migration, backend API endpoints, and mobile UI screens. Refer to PRD v1.3 Section 3.2 for complete specifications.*

---

## PHASE 2.6: ADVANCED DIFFERENTIATION FEATURES

---

## F17: TRANSPARENT SCORING METHODOLOGY (1 week, Priority: CRITICAL)

### Overview
Allow users to understand and customize how their score is calculated, building trust through transparency.

### Database Migration (Step 1)

Create file: `supabase/migrations/20251030000009_create_scoring_preferences.sql`

```sql
-- User scoring preferences
CREATE TABLE user_scoring_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE ON DELETE CASCADE,
  symmetry_weight INT DEFAULT 20 CHECK (symmetry_weight BETWEEN 15 AND 25),
  skin_weight INT DEFAULT 20 CHECK (skin_weight BETWEEN 15 AND 25),
  jawline_weight INT DEFAULT 15 CHECK (jawline_weight BETWEEN 10 AND 20),
  eyes_weight INT DEFAULT 15 CHECK (eyes_weight BETWEEN 10 AND 20),
  lips_weight INT DEFAULT 15 CHECK (lips_weight BETWEEN 10 AND 20),
  bone_structure_weight INT DEFAULT 15 CHECK (bone_structure_weight BETWEEN 10 AND 20),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT total_weight_100 CHECK (
    symmetry_weight + skin_weight + jawline_weight + 
    eyes_weight + lips_weight + bone_structure_weight = 100
  )
);

-- RLS Policies
ALTER TABLE user_scoring_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own preferences" ON user_scoring_preferences 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own preferences" ON user_scoring_preferences 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own preferences" ON user_scoring_preferences 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_scoring_preferences_user ON user_scoring_preferences(user_id);
```

### Backend API (Step 2)

Create `backend/api/scoring/preferences.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Default weights and methodology
const DEFAULT_METHODOLOGY = {
  symmetry: {
    weight: 20,
    adjustableRange: [15, 25],
    factors: [
      'Face horizontal symmetry (left/right)',
      'Eye alignment and spacing',
      'Nose centering',
      'Mouth symmetry'
    ],
    measurement: 'Facial landmark analysis (68 points)',
    scientificBasis: 'Studies show <5% deviation is ideal (Rhodes et al., 2007)'
  },
  skin: {
    weight: 20,
    adjustableRange: [15, 25],
    factors: [
      'Texture uniformity',
      'Blemish detection',
      'Under-eye darkness',
      'Overall complexion'
    ],
    measurement: 'Computer vision texture analysis',
    scientificBasis: 'Clear skin correlates with health perception (Fink et al., 2012)'
  },
  // ... other categories
};

export default async function handler(req, res) {
  const { userId } = req.query;
  
  if (req.method === 'GET') {
    // Get user preferences or defaults
    const { data: prefs } = await supabase
      .from('user_scoring_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return res.status(200).json({
      preferences: prefs || DEFAULT_METHODOLOGY,
      methodology: DEFAULT_METHODOLOGY
    });
    
  } else if (req.method === 'PUT') {
    // Update preferences
    const { weights } = req.body;
    
    // Validate total = 100
    const total = Object.values(weights).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      return res.status(400).json({ error: 'Weights must sum to 100' });
    }
    
    const { data, error } = await supabase
      .from('user_scoring_preferences')
      .upsert({
        user_id: userId,
        ...weights,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(200).json({ preferences: data });
  }
}
```

Create `backend/api/scoring/recalculate.js`:

```javascript
// Recalculate score with custom weights
export default async function handler(req, res) {
  const { analysisId, customWeights } = req.body;
  
  // Get original breakdown
  const { data: analysis } = await supabase
    .from('analyses')
    .select('breakdown')
    .eq('id', analysisId)
    .single();
  
  // Recalculate with custom weights
  const newScore = Object.entries(analysis.breakdown).reduce((total, [category, score]) => {
    const weight = customWeights[category] / 100;
    return total + (score * weight);
  }, 0);
  
  return res.status(200).json({
    originalScore: analysis.score,
    customScore: newScore,
    delta: newScore - analysis.score
  });
}
```

### Mobile UI (Step 3)

Create `mobile/lib/screens/scoring_methodology_screen.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ScoringMethodologyScreen extends ConsumerStatefulWidget {
  final String analysisId;
  
  const ScoringMethodologyScreen({required this.analysisId});
  
  @override
  ConsumerState<ScoringMethodologyScreen> createState() => _ScoringMethodologyScreenState();
}

class _ScoringMethodologyScreenState extends ConsumerState<ScoringMethodologyScreen> {
  Map<String, int> weights = {
    'symmetry': 20,
    'skin': 20,
    'jawline': 15,
    'eyes': 15,
    'lips': 15,
    'bone_structure': 15,
  };
  
  double? customScore;
  
  Future<void> recalculateScore() async {
    final result = await ref.read(apiServiceProvider).recalculateScore(
      analysisId: widget.analysisId,
      customWeights: weights,
    );
    
    setState(() {
      customScore = result['customScore'];
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('How Your Score Was Calculated'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            tooltip: 'Reset to Default',
            onPressed: () {
              setState(() {
                weights = {
                  'symmetry': 20,
                  'skin': 20,
                  'jawline': 15,
                  'eyes': 15,
                  'lips': 15,
                  'bone_structure': 15,
                };
              });
              recalculateScore();
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (customScore != null)
              Card(
                color: Theme.of(context).primaryColor.withOpacity(0.1),
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, color: Theme.of(context).primaryColor),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'With your custom weights, your score would be: ${customScore!.toStringAsFixed(1)}/10',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            
            SizedBox(height: 24),
            
            Text(
              'Adjust Category Weights',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            SizedBox(height: 8),
            Text(
              'Customize how each category contributes to your overall score. Total must equal 100%.',
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
            
            SizedBox(height: 24),
            
            ...weights.keys.map((category) => CategoryWeightSlider(
              category: category,
              currentWeight: weights[category]!,
              minWeight: category == 'symmetry' || category == 'skin' ? 15 : 10,
              maxWeight: category == 'symmetry' || category == 'skin' ? 25 : 20,
              onChanged: (value) {
                setState(() {
                  weights[category] = value.round();
                });
                recalculateScore();
              },
            )),
            
            SizedBox(height: 32),
            
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () {
                  // Navigate to full methodology page
                },
                child: Text('View Full Methodology'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CategoryWeightSlider extends StatelessWidget {
  final String category;
  final int currentWeight;
  final int minWeight;
  final int maxWeight;
  final Function(double) onChanged;
  
  const CategoryWeightSlider({
    required this.category,
    required this.currentWeight,
    required this.minWeight,
    required this.maxWeight,
    required this.onChanged,
  });
  
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  category.toUpperCase(),
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(
                  '$currentWeight%',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Theme.of(context).primaryColor),
                ),
              ],
            ),
            SizedBox(height: 12),
            Slider(
              value: currentWeight.toDouble(),
              min: minWeight.toDouble(),
              max: maxWeight.toDouble(),
              divisions: maxWeight - minWeight,
              label: '$currentWeight%',
              onChanged: onChanged,
            ),
            Text(
              'Range: $minWeight% - $maxWeight%',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
```

### Testing Checklist (Step 4)

- [ ] Database migration successful
- [ ] Can view default methodology
- [ ] Sliders adjust within valid ranges
- [ ] Total weight always equals 100%
- [ ] Score recalculates in real-time
- [ ] Can reset to defaults
- [ ] Full methodology page renders
- [ ] RLS policies prevent unauthorized access

---

## F18: 3-TIER ACTION PLANS (1 week, Priority: CRITICAL)

### Overview
Enhance routine generator to provide DIY, OTC, and Professional guidance for each weak area.

### Backend Enhancement (Step 1)

Modify `backend/api/routines/generate.js` to include action plan generation:

```javascript
async function generateActionPlans(breakdown, analysisScore) {
  const weakAreas = Object.entries(breakdown)
    .filter(([key, value]) => value < 7.0)
    .map(([category, score]) => ({ category, score }));
  
  const actionPlans = [];
  
  for (const area of weakAreas) {
    const severity = area.score < 5 ? 'severe' : area.score < 6.5 ? 'moderate' : 'mild';
    
    // Generate with AI
    const prompt = `Create a 3-tier action plan for improving ${area.category} (current score: ${area.score}/10, severity: ${severity}).

Provide three approaches:
1. DIY: Free or low-cost (<$30) home remedies and routines. Time: 8-12 weeks. List 4-5 specific actions.
2. OTC: Over-the-counter products ($50-150). Time: 4-8 weeks. List 3-4 specific products with prices.
3. Professional: Medical/professional treatments ($200-1500). Time: 2-6 months. List 2-3 treatments with details.

For each tier, include:
- Estimated cost range
- Time to results
- Effectiveness rating (low/medium/high/very high)
- Scientific backing
- When to consider

Return as JSON.`;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a knowledgeable beauty and wellness advisor. Provide evidence-based, safe recommendations.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });
    
    const plan = JSON.parse(completion.choices[0].message.content);
    
    actionPlans.push({
      category: area.category,
      currentScore: area.score,
      targetScore: Math.min(area.score + 1.5, 9.5),
      severity,
      ...plan
    });
  }
  
  return actionPlans;
}
```

### Mobile UI (Step 2)

Create `mobile/lib/screens/action_plan_screen.dart`:

```dart
import 'package:flutter/material.dart';

class ActionPlanScreen extends StatelessWidget {
  final Map<String, dynamic> actionPlan;
  
  const ActionPlanScreen({required this.actionPlan});
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${actionPlan['category']} Improvement Plan'),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Header Card
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.red.shade400, Colors.orange.shade400],
                ),
              ),
              child: Column(
                children: [
                  Icon(Icons.warning_amber_rounded, size: 48, color: Colors.white),
                  SizedBox(height: 12),
                  Text(
                    '${actionPlan['severity'].toUpperCase()} ${actionPlan['category'].toUpperCase()} ISSUES',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Current: ${actionPlan['currentScore']}/10 → Target: ${actionPlan['targetScore']}/10',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ],
              ),
            ),
            
            // DIY Approach
            ApproachCard(
              title: 'DIY APPROACH',
              cost: actionPlan['diy']['estimatedCost'],
              time: actionPlan['diy']['timeToResults'],
              effectiveness: actionPlan['diy']['effectiveness'],
              items: actionPlan['diy']['routine'],
              science: actionPlan['diy']['scienceBacking'],
              color: Colors.blue,
              icon: Icons.home,
              onTap: () {
                // Add to routine
              },
            ),
            
            // OTC Products
            ApproachCard(
              title: 'OTC PRODUCTS',
              cost: actionPlan['otc']['estimatedCost'],
              time: actionPlan['otc']['timeToResults'],
              effectiveness: actionPlan['otc']['effectiveness'],
              items: actionPlan['otc']['products'].map((p) => '${p['name']} (\$${p['price']}) - ${p['purpose']}').toList(),
              science: actionPlan['otc']['scienceBacking'],
              color: Colors.purple,
              icon: Icons.shopping_bag,
              onTap: () {
                // Navigate to marketplace
              },
            ),
            
            // Professional Treatments
            ApproachCard(
              title: 'PROFESSIONAL TREATMENTS',
              cost: actionPlan['professional']['estimatedCost'],
              time: actionPlan['professional']['timeToResults'],
              effectiveness: actionPlan['professional']['effectiveness'],
              items: actionPlan['professional']['treatments'].map((t) => '${t['name']} - ${t['description']}').toList(),
              science: actionPlan['professional']['warning'],
              color: Colors.green,
              icon: Icons.local_hospital,
              warning: true,
              onTap: () {
                // Find professional
              },
            ),
          ],
        ),
      ),
    );
  }
}
```

*Note: Complete implementations for F19 (Challenges), F20 (Ethical Guardrails), and F21 (Wearable Integration) are detailed in PRD v1.3 Section 3.4. Each follows the same migration → backend → mobile UI pattern.*

---

## 📊 PROGRESS TRACKING

Use this checklist to track implementation progress:

### Phase 2 (Weeks 5-8)
- [ ] F7: Custom Routines - Database migration
- [ ] F7: Custom Routines - Backend API (8 endpoints)
- [ ] F7: Custom Routines - Mobile UI (5 screens)
- [ ] F7: Custom Routines - Testing complete
- [ ] F8: Before/After - Database view
- [ ] F8: Before/After - Backend API
- [ ] F8: Before/After - Mobile UI
- [ ] F8: Before/After - Testing complete
- [ ] F9: Daily Streaks - Implementation
- [ ] F10: Achievement Badges - Implementation
- [ ] F11: Photo Gallery - Implementation

### Phase 2.5 (Weeks 9-16)
- [ ] F12: AI Chat Coach - Implementation
- [ ] F13: Goal Setting - Implementation
- [ ] F14: Push Notifications - Enhancement
- [ ] F15: Product Marketplace - Implementation
- [ ] F16: Insights Dashboard - Implementation

### Phase 2.6 (Weeks 13-20) - Advanced Differentiation
- [ ] F17: Transparent Scoring - Database migration
- [ ] F17: Transparent Scoring - Backend API (preferences, recalculate)
- [ ] F17: Transparent Scoring - Mobile UI (methodology screen)
- [ ] F17: Transparent Scoring - Testing complete
- [ ] F18: 3-Tier Action Plans - Backend enhancement
- [ ] F18: 3-Tier Action Plans - Mobile UI (action plan screens)
- [ ] F18: 3-Tier Action Plans - Testing complete
- [ ] F19: Challenges & Verification - Database tables
- [ ] F19: Challenges & Verification - Photo verification logic
- [ ] F19: Challenges & Verification - Mobile UI (challenge screens)
- [ ] F19: Challenges & Verification - Testing complete
- [ ] F20: Ethical Guardrails - Database tables
- [ ] F20: Ethical Guardrails - Wellness check logic
- [ ] F20: Ethical Guardrails - Onboarding disclaimers
- [ ] F20: Ethical Guardrails - Mental health resources
- [ ] F20: Ethical Guardrails - Testing complete
- [ ] F21: Wearable Integration - Database tables
- [ ] F21: Wearable Integration - Apple Health integration
- [ ] F21: Wearable Integration - Google Fit integration
- [ ] F21: Wearable Integration - Correlation analysis
- [ ] F21: Wearable Integration - Mobile UI (wellness dashboard)
- [ ] F21: Wearable Integration - Testing complete

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying each feature to production:

1. **Database**
   - [ ] Migration tested on staging
   - [ ] Indexes created and verified
   - [ ] RLS policies tested
   - [ ] Backup created

2. **Backend**
   - [ ] All API endpoints tested
   - [ ] Error handling implemented
   - [ ] Rate limiting configured
   - [ ] Logging added

3. **Mobile**
   - [ ] UI tested on iOS and Android
   - [ ] Loading states implemented
   - [ ] Error states handled
   - [ ] Offline mode considered

4. **Testing**
   - [ ] Unit tests passing
   - [ ] Integration tests passing
   - [ ] Manual QA complete
   - [ ] Performance benchmarks met

5. **Monitoring**
   - [ ] Analytics events added
   - [ ] Error tracking configured
   - [ ] Performance metrics tracked

---

## 📞 SUPPORT & QUESTIONS

If you encounter issues during implementation:

1. **Check PRD** - All feature specs are in `PRD.md` version 1.3
2. **Review Architecture** - System design in `ARCHITECTURE.md`
3. **Database Schema** - Full schema in PRD Section 5
4. **API Specs** - Complete API documentation in PRD Section 6

**Expected Outcomes (After All Phases):**
- **DAU/MAU:** 40% → 75%+ (+87.5% improvement)
- **Subscription Rate:** 15% → 28-30% (+100% improvement)
- **MRR:** $600K → $1.2M (+100% improvement)
- **Churn:** <5% → <2% (-60% improvement)
- **NPS Score:** 45 → 75+ (+66.7% improvement)
- **Additional ARR:** +$10.8M over 12 months
- **ROI:** 246x on $58,500 investment

**Competitive Moat Created:**
- ✅ **Transparency:** Only app with user-adjustable scoring weights
- ✅ **Multi-Tier Guidance:** DIY/OTC/Professional pathways (vs single-solution competitors)
- ✅ **Photo Verification:** Reliable progress tracking (vs unreliable angle/lighting variations)
- ✅ **Ethical Design:** Mental health resources & responsible messaging (vs unregulated competitors)
- ✅ **Wellness Integration:** First looksmaxxing app connecting appearance to health metrics

---

**END OF IMPLEMENTATION GUIDE**

This guide covers all 16 new features across three phases. Each feature follows the same structure:
1. Database migrations
2. Backend API implementation
3. Mobile UI development
4. Testing & validation

**Implementation Order:**
1. **Phase 2 (Weeks 5-8):** F7-F11 - Daily engagement features
2. **Phase 2.5 (Weeks 9-16):** F12-F16 - Advanced engagement & monetization
3. **Phase 2.6 (Weeks 13-20):** F17-F21 - Advanced differentiation (can run in parallel with 2.5)

**Critical Path:**
- F20 (Ethical Guardrails) should be implemented ASAP for brand safety
- F17 (Transparent Scoring) is critical for trust-building
- F7 (Custom Routines) is the foundation for F18 (Action Plans) and F19 (Challenges)

Follow this guide sequentially within each phase. Phase 2.6 can begin in Week 13 (overlapping with Phase 2.5) for faster time-to-market. Good luck! 🚀

