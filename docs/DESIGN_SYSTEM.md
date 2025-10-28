# Black Pill Design System

Complete visual design specification for Black Pill.

---

## 🎨 Color Palette

### Backgrounds
```css
Deep Black:  #0F0F1E  /* Main background */
Dark Gray:   #1A1A2E  /* Cards, elevated surfaces */
Charcoal:    #2A2A3E  /* Hover states, inputs */
```

### Neon Accents
```css
Neon Pink:   #FF0080  /* Primary actions, scores */
Neon Cyan:   #00D9FF  /* Secondary actions, links */
Neon Purple: #B700FF  /* Premium features */
Neon Yellow: #FFFF00  /* Warnings, alerts */
Neon Green:  #00FF41  /* Success, positive feedback */
```

### Text
```css
Primary:     #FFFFFF  /* Headings, important text */
Secondary:   #B8BACC  /* Body text */
Tertiary:    #6B6D7F  /* Subtle text, labels */
Disabled:    #4A4C5A  /* Disabled states */
```

### Gradients
```css
/* Primary Gradient */
background: linear-gradient(135deg, #FF0080 0%, #00D9FF 100%);

/* Secondary Gradient */
background: linear-gradient(135deg, #00D9FF 0%, #B700FF 100%);

/* Premium Gradient */
background: linear-gradient(135deg, #B700FF 0%, #FF0080 100%);
```

---

## 📝 Typography

### Font Family
**Inter** (Google Fonts)
- Weights: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

### Type Scale

**Display Large (H1)**
```css
font-size: 36px;
font-weight: 700;
letter-spacing: -1px;
line-height: 1.2;
color: #FFFFFF;
```

**Display Medium (H2)**
```css
font-size: 28px;
font-weight: 700;
line-height: 1.3;
```

**Display Small (H3)**
```css
font-size: 24px;
font-weight: 600;
line-height: 1.3;
```

**Headline Large**
```css
font-size: 20px;
font-weight: 600;
line-height: 1.4;
```

**Body Large**
```css
font-size: 16px;
font-weight: 400;
line-height: 1.6;
```

**Body Medium (Default)**
```css
font-size: 14px;
font-weight: 400;
line-height: 1.6;
color: #B8BACC;
```

**Body Small**
```css
font-size: 12px;
font-weight: 400;
color: #6B6D7F;
```

**Label (Buttons)**
```css
font-size: 14px;
font-weight: 600;
```

---

## 🧩 Components

### Glass Cards
```css
background: rgba(26, 26, 46, 0.7);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 12px;
```

**Usage:**
- Content containers
- Feature cards
- Modal backgrounds
- Information panels

---

### Primary Button
```css
/* Gradient Background */
background: linear-gradient(135deg, #FF0080 0%, #00D9FF 100%);
height: 56px;
border-radius: 12px;
font-size: 14px;
font-weight: 600;
color: #FFFFFF;
box-shadow: 0 4px 20px rgba(255, 0, 128, 0.3);
```

**States:**
- Hover: Slight scale (1.02)
- Active: Scale (0.98)
- Disabled: Opacity 0.5

---

### Input Fields
```css
height: 48px;
background: rgba(26, 26, 46, 0.5);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 12px;
padding: 0 16px;
font-size: 14px;
color: #FFFFFF;

/* Focus State */
border: 2px solid #FF0080;
box-shadow: 0 0 0 4px rgba(255, 0, 128, 0.1);
```

---

### Score Circle
```css
width: 140px;
height: 140px;
border-radius: 50%;

/* Outer Ring (Gradient) */
background: linear-gradient(135deg, #FF0080 0%, #00D9FF 100%);
padding: 4px;

/* Inner Circle */
background: #0F0F1E;

/* Glow Effect */
box-shadow: 
  0 0 30px rgba(255, 0, 128, 0.5),
  0 0 60px rgba(0, 217, 255, 0.3);
```

**Score Text:**
```css
font-size: 48px;
font-weight: 700;
color: #FFFFFF;
```

---

### Breakdown Bars
```css
/* Container */
height: 8px;
background: #2A2A3E;
border-radius: 4px;

/* Fill */
background: linear-gradient(90deg, #FF0080 0%, #00D9FF 100%);
border-radius: 4px;
box-shadow: 0 2px 8px rgba(255, 0, 128, 0.5);
```

**Animation:**
- Duration: 800ms
- Curve: ease-out-cubic
- Stagger: 100ms between bars

---

### Badges (Top 3, Achievements)
```css
/* Unlocked */
background: linear-gradient(135deg, #FF0080 0%, #00D9FF 100%);
padding: 12px 16px;
border-radius: 20px;
color: #0F0F1E;
font-weight: 600;

/* Locked */
background: #2A2A3E;
border: 1px solid rgba(255, 255, 255, 0.1);
color: #4A4C5A;
```

---

## 🎬 Animations

### Durations
```css
Fast:     200ms  /* Hover states, ripples */
Normal:   300ms  /* Page transitions, slides */
Slow:     500ms  /* Score reveals, major animations */
Confetti: 800ms  /* Celebration animation */
```

### Easing
```css
Default:       ease-in-out
Score Reveal:  cubic-bezier(0.34, 1.56, 0.64, 1) /* Bounce */
Slide In:      cubic-bezier(0.16, 1, 0.3, 1)     /* Smooth */
```

### Common Animations

**Fade In:**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fadeIn 300ms ease-in-out;
```

**Scale Up:**
```css
@keyframes scaleUp {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
animation: scaleUp 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

**Slide Up:**
```css
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
animation: slideUp 300ms ease-out;
```

---

## 📐 Spacing Scale

```css
xs:  4px   /* Tight spacing */
sm:  8px   /* Small gaps */
md:  16px  /* Default spacing */
lg:  24px  /* Section spacing */
xl:  32px  /* Major sections */
2xl: 48px  /* Large gaps */
3xl: 64px  /* Hero sections */
```

---

## 🎯 Touch Targets

**Minimum Size:** 44x44px (iOS) / 48x48dp (Android)

**Interactive Elements:**
- Buttons: 56px height minimum
- Icon buttons: 44x44px minimum
- List items: 56px height minimum
- Form inputs: 48px height

---

## ♿ Accessibility

### Contrast Ratios
- **Text on Deep Black:** ≥ 4.5:1 (AA)
- **Large Text:** ≥ 3:1 (AA)
- **Interactive Elements:** Clear focus indicators

### Focus States
```css
outline: 2px solid #FF0080;
outline-offset: 2px;
```

### Screen Reader Labels
- All images have alt text
- All buttons have semantic labels
- Form fields have associated labels
- Status messages announced

---

## 📱 Responsive Breakpoints

### Mobile
```css
Small:  320px - 375px  /* iPhone SE, small Android */
Medium: 375px - 428px  /* iPhone 12/13/14 */
Large:  428px+         /* iPhone Pro Max, large Android */
```

### Tablet (Future)
```css
768px+   /* iPad, Android tablets */
```

---

## 🎨 Component Library

### Cards
```css
.glass-card {
  background: rgba(26, 26, 46, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
}

.stat-card {
  /* Extends glass-card */
  text-align: center;
  min-height: 120px;
}
```

### Buttons
```css
.primary-button {
  background: linear-gradient(135deg, #FF0080 0%, #00D9FF 100%);
  height: 56px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 200ms ease;
}

.primary-button:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(255, 0, 128, 0.4);
}

.secondary-button {
  background: transparent;
  border: 2px solid #00D9FF;
  color: #00D9FF;
}
```

### Inputs
```css
.text-input {
  height: 48px;
  background: rgba(26, 26, 46, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0 16px;
  font-size: 14px;
}

.text-input:focus {
  border: 2px solid #FF0080;
  outline: none;
}
```

---

## 🎭 Icons

**Icon Set:** Material Icons (Flutter default)

**Sizes:**
- Small: 16px
- Medium: 24px (default)
- Large: 32px
- Hero: 48px+

**Colors:**
- Match accent colors
- Neon Pink for primary actions
- Neon Cyan for secondary actions
- White for navigation

---

## 📊 Charts (fl_chart)

### Line Chart (Progress Screen)
```dart
LineChartData(
  gridData: FlGridData(
    drawVerticalLine: false,
    horizontalLine: FlLine(color: #2A2A3E),
  ),
  lineBarsData: [
    LineChartBarData(
      spots: [...],
      isCurved: true,
      gradient: primaryGradient,
      barWidth: 3,
      dotData: FlDotData(
        color: #FFFFFF,
        strokeColor: #FF0080,
      ),
      belowBarData: BarAreaData(
        gradient: fadeGradient,
      ),
    ),
  ],
)
```

---

## 🌈 Dark Mode Only

Black Pill uses a dark theme exclusively to:
- Reduce eye strain
- Enhance neon colors
- Create modern, premium feel
- Save battery on OLED screens

**No light mode planned.**

---

## 📏 Layout Guidelines

### Screen Padding
```css
Mobile: 24px horizontal, 16px vertical
Tablet: 40px horizontal, 24px vertical
```

### Card Spacing
```css
Between cards: 16px
Card inner padding: 20px
```

### Section Spacing
```css
Between major sections: 32px
Between subsections: 24px
```

---

## ✨ Special Effects

### Confetti (Score ≥ 7.5)
```dart
ConfettiWidget(
  blastDirectionality: BlastDirectionality.explosive,
  colors: [
    neonPink,
    neonCyan,
    neonPurple,
    neonGreen,
  ],
  numberOfParticles: 20,
  emissionFrequency: 0.05,
)
```

### Shimmer Loading
```dart
Shimmer.fromColors(
  baseColor: darkGray,
  highlightColor: charcoal,
  child: [...],
)
```

### Glow Effects
```css
box-shadow: 
  0 0 20px rgba(255, 0, 128, 0.5),
  0 0 40px rgba(0, 217, 255, 0.3),
  0 0 60px rgba(183, 0, 255, 0.2);
```

---

## 🖼️ Images

### Aspect Ratios
- Profile avatars: 1:1 (square)
- Analysis photos: Free (maintain original)
- Share cards: 9:16 (portrait, 1080x1920px)

### Image Quality
- Upload: Max 2MB, JPEG 85%
- Thumbnails: 200x200px, JPEG 80%
- Share cards: 1080x1920px, PNG

---

## 📐 Grid System

### Layout Grid
```css
Columns: 12
Gutter: 16px
Margin: 24px
```

### Common Layouts
- **Single column:** Full width (mobile)
- **Two column:** 50/50 split (stats)
- **Three column:** Equal (filter chips)

---

## 🎯 UI Patterns

### Empty States
```
Icon (64px, tertiary color)
Headline (displaySmall)
Description (bodyMedium)
CTA Button (primary)
```

### Loading States
```
Shimmer placeholders
OR
Spinner (neonPink)
Status text (bodyMedium)
```

### Error States
```
Warning icon (neonYellow)
Error message (bodyMedium)
Retry button (secondary)
```

### Success States
```
Check icon (neonGreen)
Success message (bodyMedium)
Continue button (primary)
```

---

## 🎨 Usage Examples

### Score Display (Results Screen)
- Large score circle (200x200px)
- Gradient border with glow
- Animated reveal (1500ms)
- Confetti for ≥7.5

### Breakdown Bars
- 6 categories stacked
- Animated fill (800ms each)
- Stagger: 100ms between bars
- Labels left, scores right

### Tier Cards (Paywall)
- Glass cards with gradient borders
- "Most Popular" badge (gradient)
- Check icons (neonGreen)
- Prices (neonPink, large)

### Leaderboard Items
- Top 3: Emoji badges (🥇🥈🥉)
- Gradient backgrounds for top 3
- Current user: Pink border + highlight
- Avatar (48px circle)

---

## 🔧 Implementation Notes

### Flutter
```dart
// Use provided theme
Theme.of(context).textTheme.displayLarge

// Access colors
AppColors.neonPink
AppColors.primaryGradient

// Glass effect
GlassCard(child: ...)

// Buttons
PrimaryButton(text: 'Click Me')
```

### CSS/Web (Creator Dashboard)
```css
/* Import Inter */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* Use design tokens */
--color-bg-primary: #0F0F1E;
--color-accent-pink: #FF0080;
```

---

## ✅ Accessibility Checklist

- [ ] All text meets 4.5:1 contrast ratio
- [ ] Touch targets ≥ 44x44px
- [ ] Focus indicators visible
- [ ] Screen reader labels present
- [ ] Form errors announced
- [ ] Images have alt text
- [ ] Semantic HTML/widgets
- [ ] Keyboard navigation works

---

## 📱 Platform-Specific

### iOS
- Use SF Symbols where appropriate
- Native navigation transitions
- Pull-to-refresh standard gesture
- Bottom safe area padding

### Android
- Material Design 3 components
- Ripple effects on taps
- FAB for primary actions
- Navigation drawer (if needed)

---

## 🎨 Brand Assets

### Logo
- Circle with face icon
- Gradient fill (primaryGradient)
- Sizes: 40px, 80px, 120px, 512px

### App Icons
- iOS: 1024x1024px
- Android: Adaptive icon (108x108dp safe zone)
- Background: Deep Black
- Foreground: Gradient circle with face

### Share Card Template
```
Size: 1080x1920px
Background: Deep Black (#0F0F1E)
Score: Center, 96px, neonPink
Breakdown: 6 bars, labels left
Referral Code: Bottom, mono font
QR Code: 120x120px, pink tint
Watermark: "blackpill.app" footer
```

---

**Design System Version:** 1.0
**Last Updated:** October 27, 2025

