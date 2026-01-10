# Technology Stack

## Overview
BlackPill is a TypeScript monorepo with React Native/Expo mobile apps and Next.js web application, backed by Supabase PostgreSQL and Edge Functions.

## Primary Languages
| Language | Version | Usage |
|----------|---------|-------|
| TypeScript | 5.x (web), ~5.9.2 (mobile) | Primary language throughout |
| JavaScript | ES2017+ | Build scripts, config |
| SQL | PostgreSQL | Database migrations, RLS policies |

## Frameworks

### Mobile (React Native + Expo)
| Package | Version | Purpose |
|---------|---------|---------|
| react-native | 0.81.5 | Mobile framework |
| expo | ~54.0.25 | Development platform |
| react | 19.1.0 | UI library |
| @react-navigation/native | 7.1.20 | Navigation |
| @react-navigation/bottom-tabs | 7.8.5 | Tab navigation |
| @react-navigation/native-stack | 7.6.3 | Stack navigation |

### Web (Next.js)
| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.0.7 | Web framework |
| react | ^19.2.0 | UI library |
| react-dom | ^19.2.0 | DOM rendering |

### Backend (Supabase Edge Functions)
- Runtime: Deno
- OpenAI SDK: 4.20.1 (Deno-compatible)

## Key Dependencies

### Database & Auth
| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | 2.83.0 | Supabase client |
| @supabase/ssr | 0.7.0 | Server-side Supabase (web) |

### Payments
| Package | Version | Platform |
|---------|---------|----------|
| stripe | 20.0.0 | Web payments |
| react-native-purchases | 8.2.0 | Mobile IAP (RevenueCat) |

### AI
| Package | Version | Purpose |
|---------|---------|---------|
| openai | 6.9.1 (web) | OpenAI API client |

### Mobile-Specific
| Package | Version | Purpose |
|---------|---------|---------|
| expo-camera | ~17.0.9 | Camera access |
| expo-image-picker | ~17.0.8 | Image selection |
| expo-secure-store | ~15.0.7 | Encrypted storage |
| expo-notifications | ~0.32.13 | Push notifications |
| react-native-reanimated | 4.1.1 | Animations |
| moti | 0.30.0 | Animation utilities |
| @sentry/react-native | ~7.2.0 | Error tracking |

### Web-Specific
| Package | Version | Purpose |
|---------|---------|---------|
| framer-motion | 12.23.24 | Animations |
| recharts | 3.4.1 | Charts |
| resend | 6.5.0 | Email service |
| web-push | 3.6.7 | Push notifications |
| sharp | 0.33.5 | Image processing |
| @upstash/ratelimit | 2.0.7 | Rate limiting |
| ioredis | 5.8.2 | Redis client |
| cloudinary | 2.8.0 | Image CDN |

### Media Processing
| Package | Version | Purpose |
|---------|---------|---------|
| @ffmpeg/ffmpeg | 0.12.15 | Video encoding |
| canvas | 3.2.0 | Image manipulation (web) |

## Development Tools
| Tool | Version | Purpose |
|------|---------|---------|
| ESLint | 9 | Linting (web) |
| Prettier | 3.6.2 | Code formatting |
| Tailwind CSS | 4 | Styling (web) |
| babel-preset-expo | 54.0.7 | Babel preset (mobile) |

## Build & Deployment
| Tool | Purpose |
|------|---------|
| Vercel | Web hosting |
| EAS Build | Mobile app builds |
| Supabase CLI | Edge function deployment |

## Runtime Versions
- Node.js: Latest LTS (Vercel)
- Deno: Latest (Supabase Edge Functions)
- React Native: 0.81.5
- Expo SDK: 54

## TypeScript Configuration

### Mobile (strict)
```json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-native"
  }
}
```

### Web (relaxed)
```json
{
  "compilerOptions": {
    "strict": false,
    "jsx": "react-jsx"
  }
}
```
