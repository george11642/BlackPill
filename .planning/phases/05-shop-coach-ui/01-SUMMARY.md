# Phase 5: Shop & Coach UI — Summary

## Objective
Fix title overflow issues on Shop and AI Coach screens.

## Investigation Findings

1. **GradientText component** - The core issue was that GradientText didn't properly constrain its width or support text truncation for overflow.

2. **MarketplaceScreen topBar** - Used an unstructured layout with `justifyContent: 'space-between'` that could cause the centered title to overflow.

3. **BackHeader component** - Already had `numberOfLines={1}` but relied on GradientText to handle truncation properly.

## Changes Made

### GradientText Enhancement
**Files:**
- `mobile/components/GradientText.tsx`
- `shemax-mobile/components/GradientText.tsx`

**Changes:**
1. Added `maxWidth` prop for explicit width control
2. Added `ellipsizeMode="tail"` when `numberOfLines` is set
3. Constrained container with `maxWidth` on MaskedView
4. Fixed LinearGradient colors type assertion for TypeScript

```tsx
// New prop
maxWidth?: number;

// Text with ellipsis support
<Text
  numberOfLines={numberOfLines}
  ellipsizeMode={numberOfLines ? 'tail' : undefined}
  style={[textStyle, { maxWidth: effectiveMaxWidth }]}
>

// Constrained container
<MaskedView style={{ maxWidth: effectiveMaxWidth }}>
```

### MarketplaceScreen Layout Fix
**Files:**
- `mobile/screens/MarketplaceScreen.tsx`
- `shemax-mobile/screens/MarketplaceScreen.tsx`

**Changes:**
1. Wrapped GradientText in flex container with `flex: 1`
2. Added `numberOfLines={1}` to enable truncation
3. Added fixed-width placeholder for balanced centering
4. Removed unused `screenTitle` style

```tsx
// Before
<GradientText text="Marketplace" style={styles.screenTitle} />
<View style={{ width: 24 }} />

// After
<View style={styles.titleContainer}>
  <GradientText text="Marketplace" numberOfLines={1} />
</View>
<View style={styles.placeholder} />
```

## Verification
- [x] GradientText supports maxWidth prop
- [x] GradientText properly truncates with ellipsis
- [x] MarketplaceScreen title stays within bounds
- [x] BackHeader uses numberOfLines for truncation
- [x] Both mobile apps updated

## Result
- Titles on Shop/Marketplace and AI Coach screens no longer overflow
- Long titles will properly truncate with ellipsis
- Layout remains centered and balanced

---
*Completed: 2026-01-10*
