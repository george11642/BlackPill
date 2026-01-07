/**
 * Task Normalization and Deduplication
 * 
 * Automatically normalizes and deduplicates tasks to prevent duplicates
 * when displaying or managing routine tasks.
 */

export interface RoutineTask {
  id: string;
  title: string;
  description?: string;
  category: string;
  completed: boolean;
  emoji?: string;
  routine_id: string;
  routine_name?: string;
  duration_minutes?: number;
  why_it_helps?: string;
  time_of_day?: string[];
  frequency?: 'daily' | 'weekly' | 'every_other_day';
}

/**
 * Normalize a task title for comparison
 * - Lowercase
 * - Remove extra whitespace
 * - Remove punctuation
 * - Remove common words that don't change meaning
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    // Remove common filler words
    .replace(/\b(the|a|an|your|my|for|to|with|and|or)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate similarity between two normalized strings
 * Uses Jaccard similarity on word sets
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(str2.split(' ').filter(w => w.length > 2));
  
  if (words1.size === 0 && words2.size === 0) return 1;
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Check if two tasks are duplicates
 * - Same category
 * - Similar title (>70% similarity)
 */
export function areDuplicates(task1: RoutineTask, task2: RoutineTask): boolean {
  // Different categories = not duplicates
  if (task1.category !== task2.category) return false;
  
  // Exact title match
  const norm1 = normalizeTitle(task1.title);
  const norm2 = normalizeTitle(task2.title);
  
  if (norm1 === norm2) return true;
  
  // Check similarity threshold
  const similarity = calculateSimilarity(norm1, norm2);
  return similarity >= 0.7;
}

/**
 * Deduplicate a list of tasks
 * Keeps the first occurrence and removes duplicates
 * Prioritizes completed tasks over uncompleted
 */
export function deduplicateTasks(tasks: RoutineTask[]): RoutineTask[] {
  const seen = new Map<string, RoutineTask>();
  const result: RoutineTask[] = [];
  
  // Sort to prioritize completed tasks
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed && !b.completed) return -1;
    if (!a.completed && b.completed) return 1;
    return 0;
  });
  
  for (const task of sortedTasks) {
    const normalizedTitle = normalizeTitle(task.title);
    const key = `${task.category}:${normalizedTitle}`;
    
    // Check if we've seen a similar task
    let isDuplicate = false;
    
    for (const [existingKey, existingTask] of seen.entries()) {
      if (areDuplicates(task, existingTask)) {
        isDuplicate = true;
        
        // If current task is completed and existing isn't, replace
        if (task.completed && !existingTask.completed) {
          seen.delete(existingKey);
          seen.set(key, task);
        }
        break;
      }
    }
    
    if (!isDuplicate) {
      seen.set(key, task);
      result.push(task);
    }
  }
  
  return result;
}

/**
 * Group tasks by time of day
 */
export function groupTasksByTimeOfDay(tasks: RoutineTask[]): {
  morning: RoutineTask[];
  evening: RoutineTask[];
  anytime: RoutineTask[];
} {
  const groups = {
    morning: [] as RoutineTask[],
    evening: [] as RoutineTask[],
    anytime: [] as RoutineTask[],
  };
  
  for (const task of tasks) {
    const timeOfDay = task.time_of_day || [];
    
    if (timeOfDay.includes('morning') && !timeOfDay.includes('evening')) {
      groups.morning.push(task);
    } else if (timeOfDay.includes('evening') && !timeOfDay.includes('morning')) {
      groups.evening.push(task);
    } else {
      groups.anytime.push(task);
    }
  }
  
  return groups;
}

/**
 * Group tasks by frequency
 */
export function groupTasksByFrequency(tasks: RoutineTask[]): {
  daily: RoutineTask[];
  weekly: RoutineTask[];
} {
  const groups = {
    daily: [] as RoutineTask[],
    weekly: [] as RoutineTask[],
  };
  
  for (const task of tasks) {
    if (task.frequency === 'weekly') {
      groups.weekly.push(task);
    } else {
      groups.daily.push(task);
    }
  }
  
  return groups;
}

/**
 * Sort tasks by priority
 * - Uncompleted first
 * - Then by category
 * - Then by order_index if available
 */
export function sortTasksByPriority(tasks: RoutineTask[]): RoutineTask[] {
  return [...tasks].sort((a, b) => {
    // Uncompleted first
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // Then by category
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    
    // Then by title
    return a.title.localeCompare(b.title);
  });
}

/**
 * Process tasks for display
 * - Deduplicate
 * - Sort by priority
 */
export function processTasksForDisplay(tasks: RoutineTask[]): RoutineTask[] {
  const deduplicated = deduplicateTasks(tasks);
  return sortTasksByPriority(deduplicated);
}

