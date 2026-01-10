# Code Conventions

## File Naming

### Screens
- Pattern: `*Screen.tsx`
- Examples: `MarketplaceScreen.tsx`, `CameraScreen.tsx`, `AnalysisResultScreen.tsx`

### Components
- Pattern: PascalCase `*.tsx`
- Examples: `BackHeader.tsx`, `GlassCard.tsx`, `PrimaryButton.tsx`

### Utilities/Services
- Pattern: camelCase `*.ts`
- Examples: `client.ts`, `products.ts`, `context.tsx`

### Migrations
- Pattern: `YYYYMMDDHHMMSS_description.sql`
- Example: `20260108000000_create_achievements_table.sql`

## TypeScript Patterns

### Interfaces for Props
```typescript
interface BackHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
  onBackPress?: () => void;
  variant?: 'default' | 'large';
}
```

### Types for Context/Unions
```typescript
type AuthContextType = {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
};
```

### Function Exports
```typescript
// Named exports
export async function getProducts() { }
export const apiGet = async () => { }
export function ComponentName() { }
```

## Import Organization

Order imports consistently:
```typescript
// 1. React/core
import React, { useEffect, useState } from 'react';

// 2. React Native/Platform APIs
import { View, Text, StyleSheet } from 'react-native';

// 3. Navigation & Third-party hooks
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 4. Third-party UI
import { Search, Filter } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// 5. Local imports
import { DarkTheme } from '../lib/theme';
import { BackHeader } from '../components/BackHeader';
import { useAuth } from '../lib/auth/context';
```

## Component Patterns

### Functional Components with Hooks
```typescript
export function GlassCard({
  children,
  style,
  variant = 'default',
  onPress,
}: GlassCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
```

### Default Props in Destructuring
```typescript
function Component({
  variant = 'default',
  noPadding = false,
}: Props) { }
```

## Naming Conventions

### Variables
- camelCase: `searchQuery`, `selectedCategory`, `loadingMore`
- Boolean prefixes: `isPublic`, `hasMore`, `loadingRecommendations`

### Constants
- UPPERCASE_SNAKE_CASE: `SCREEN_WIDTH`, `CARD_WIDTH`, `CATEGORIES`

### Functions
- camelCase: `loadProducts()`, `handleRefresh()`
- Render functions: `renderHeader()`, `renderEmpty()`
- Handlers: `handleBack()`, `handlePressIn()`
- Getters: `getProducts()`, `getAnalysesHistory()`

## Styling

### Mobile (React Native)
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
});
```

### Web (Tailwind CSS)
```typescript
const combinedClassName = `${baseClasses} ${variantClasses} ${sizeClasses}`;
```

### Theme Usage
- Import from `lib/theme.ts`
- Use `DarkTheme.colors.*`, `DarkTheme.spacing.*`

## Error Handling

### Custom Error Class
```typescript
export class ApiError extends Error {
  constructor(message: string, public status: number, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### Try-Catch Pattern
```typescript
try {
  // operation
} catch (error: any) {
  throw new ApiError(error.message || 'Operation failed', 500, error);
}
```

## Logging

### Prefixed Console Logs
```typescript
console.log('[API] Request:', method, endpoint);
console.error('[API] Error:', error);
console.warn('[Supabase] Warning:', message);
console.log('[Auth] Status:', status);
```

## Documentation

### JSDoc for Functions
```typescript
/**
 * Get analysis history for the current user
 */
export async function getAnalysesHistory(limit = 50): Promise<Analysis[]> {
```

### Section Headers
```typescript
// ============================================================================
// ANALYSES
// ============================================================================
```

### Module Headers
```typescript
/**
 * Supabase Direct API
 *
 * This module provides direct Supabase database access for CRUD operations,
 * replacing the need for web API routes.
 */
```

## React Patterns

### Context Usage
```typescript
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
}
```

### Component Composition
- Small, focused components
- Variant props for flexibility: `variant="default" | "elevated" | "gold"`
- Render functions for conditional JSX
