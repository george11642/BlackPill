/**
 * Achievement event system for in-app notifications
 * Uses a simple pub/sub pattern to notify UI components when achievements are unlocked
 */

export interface AchievementEvent {
  key: string;
  name: string;
  emoji: string;
  description: string;
}

type AchievementListener = (achievement: AchievementEvent) => void;

class AchievementEventEmitter {
  private listeners: Set<AchievementListener> = new Set();

  subscribe(listener: AchievementListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(achievement: AchievementEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(achievement);
      } catch (error) {
        console.error('[AchievementEvents] Error in listener:', error);
      }
    });
  }
}

export const achievementEvents = new AchievementEventEmitter();

/**
 * Trigger an achievement unlock notification
 */
export function notifyAchievementUnlocked(achievement: AchievementEvent): void {
  console.log(`[AchievementEvents] Achievement unlocked: ${achievement.name}`);
  achievementEvents.emit(achievement);
}

