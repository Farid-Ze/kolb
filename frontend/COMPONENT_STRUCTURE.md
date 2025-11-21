# Report Page - Component Structure

## Component Hierarchy

```
ReportPage (Root Component)
│
├── State Management
│   ├── report: Report | null
│   ├── loading: boolean
│   ├── error: string | null
│   └── isUnauthorized: boolean
│
├── Data Fetching (useEffect)
│   └── getReport(sessionId) from reportService
│
└── Conditional Rendering
    │
    ├── [IF loading === true]
    │   └── PageShell
    │       └── RoomContent
    │           └── motion.div (spinner container)
    │               ├── Spinner (animated div)
    │               └── BodyText ("Loading...")
    │
    ├── [IF isUnauthorized === true]
    │   └── PageShell
    │       └── RoomContent
    │           └── AuthNotice
    │               ├── title: "Sign in required"
    │               ├── message: "Please sign in..."
    │               └── onActionClick: navigate('/auth/login')
    │
    ├── [IF error || !report]
    │   └── PageShell
    │       └── RoomContent
    │           └── motion.div (error container)
    │               └── GlassMaterial
    │                   ├── Warning Icon
    │                   ├── SectionTitle (error message)
    │                   ├── BodyText (details)
    │                   └── Button ("Return Home")
    │
    └── [ELSE - Success State]
        └── PageShell
            └── RoomContent
                └── motion.div (staggerContainer)
                    │
                    ├── Header Section
                    │   ├── DisplayTitle ("Your Learning Profile")
                    │   └── BodyText (description)
                    │
                    └── Grid (2 columns on desktop, 1 on mobile)
                        │
                        ├── LEFT COLUMN
                        │   │
                        │   ├── Quadrant Visualization
                        │   │   └── motion.div (scaleIn)
                        │   │       └── GlassMaterial (intensity="high")
                        │   │           ├── Axes (horizontal + vertical lines)
                        │   │           ├── Labels (AC, CE, AE, RO)
                        │   │           ├── Quadrants Grid (2x2)
                        │   │           │   ├── Converging (AC+AE)
                        │   │           │   ├── Assimilating (AC+RO)
                        │   │           │   ├── Accommodating (CE+AE)
                        │   │           │   └── Diverging (CE+RO)
                        │   │           └── motion.div (data point)
                        │   │               └── Animated position based on ACCE/AERO
                        │   │
                        │   └── Scale Scores Card
                        │       └── GlassMaterial
                        │           ├── SectionTitle ("Scale Scores")
                        │           ├── Grid (2x2)
                        │           │   ├── CE score (if not null)
                        │           │   ├── RO score (if not null)
                        │           │   ├── AC score (if not null)
                        │           │   └── AE score (if not null)
                        │           └── Combined Dimensions Section
                        │               ├── ACCE score (if not null)
                        │               └── AERO score (if not null)
                        │
                        └── RIGHT COLUMN
                            │
                            ├── [IF report.style exists]
                            │   │
                            │   ├── Primary Learning Style (StyleSummaryCard)
                            │   │   └── motion.div (fadeInUp)
                            │   │       └── GlassMaterial (intensity="high", amber border)
                            │   │           ├── Label ("PRIMARY LEARNING STYLE")
                            │   │           ├── DisplayTitle (style name)
                            │   │           └── BodyText (brief description)
                            │   │
                            │   └── [IF primary_detail exists]
                            │       └── Detailed Analysis
                            │           └── motion.div (fadeInUp)
                            │               └── GlassMaterial
                            │                   ├── SectionTitle ("Detailed Analysis")
                            │                   └── BodyText (detail text)
                            │
                            ├── [IF report.percentiles exists]
                            │   └── NormInfoCard
                            │       └── GlassMaterial
                            │           ├── SectionTitle ("Informasi Norma")
                            │           └── List (Norm Group, Version, Fallback status)
                            │
                            ├── [IF report.lfi exists]
                            │   └── FlexibilityChart
                            │       └── GlassMaterial
                            │           ├── SectionTitle ("Learning Flexibility")
                            │           └── BarChart (CE, RO, AC, AE flexibility)
                            │
                            ├── [IF report.learningSpace exists]
                            │   └── LearningSpaceInsights
                            │       └── GlassMaterial
                            │           ├── SectionTitle ("Learning Space Insights")
                            │           ├── Spiral Stage
                            │           ├── Educator Roles
                            │           └── Heuristics
                            │
                            ├── [IF report.sessionDesigns exists]
                            │   └── SessionDesignList
                            │       └── GlassMaterial
                            │           ├── SectionTitle ("Rekomendasi Sesi")
                            │           └── List of Session Cards
                            │
                            ├── [IF report.analytics.meta exists]
                            │   └── AnalyticsMetaCard
                            │
                            └── [IF report.notes exists]
                                └── InterpretationNotes
                            │   └── Percentile Rankings
                            │       └── motion.div (fadeInUp)
                            │           └── GlassMaterial
                            │               ├── SectionTitle ("Percentile Rankings")
                            │               ├── BodyText (norm group info)
                            │               └── Grid (2x2)
                            │                   ├── CE percentile (if not null)
                            │                   ├── RO percentile (if not null)
                            │                   ├── AC percentile (if not null)
                            │                   └── AE percentile (if not null)
                            │
                            └── [IF report.lfi exists AND value not null]
                                └── Learning Flexibility
                                    └── motion.div (fadeInUp)
                                        └── GlassMaterial
                                            ├── Header Row
                                            │   ├── SectionTitle ("Learning Flexibility")
                                            │   └── Badge (LFI value)
                                            ├── BodyText (flexibility description)
                                            └── [IF lfi.percentile not null]
                                                └── LFI Percentile Display
```

## Data Flow

```
User Navigation → /report/:sessionId
         ↓
Extract sessionId from URL params
         ↓
useEffect triggered
         ↓
Set loading=true, call getReport(sessionId)
         ↓
         ├─→ Success
         │   ├─ Set report data
         │   ├─ Set loading=false
         │   └─ Render success state
         │
         └─→ Error
             ├─ 401 → Set isUnauthorized=true → Show AuthNotice
             ├─ 404 → Set error message → Show error state
             ├─ 403 → Set error message → Show error state
             └─ Other → Set error message → Show error state
```

## Animation Sequence (Success State)

```
Page Loads
    ↓
1. Spinner appears (0ms)
    ↓
2. Data fetched successfully
    ↓
3. staggerContainer animates children
    ↓
4. Header fades up (fadeInUp)
    ↓ +100ms delay
5. Quadrant scales in (scaleIn)
    ↓ within quadrant
6. Data point springs to position (delay: 500ms)
    ↓ +100ms delay
7. Scale scores card fades up
    ↓ +100ms delay
8. Primary style card fades up
    ↓ +100ms delay
9. Detailed analysis fades up
    ↓ +100ms delay
10. Percentiles card fades up (if exists)
    ↓ +100ms delay
11. LFI card fades up (if exists)
    ↓
Animation Complete (~1.5s total)
```

## Props & Dependencies

### Component Props
None - Uses route params

### External Dependencies
```typescript
// React & Router
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Animation
import { motion } from 'framer-motion';

// Design System
import { GlassMaterial } from '../core/design-system/Materials';
import { DisplayTitle, BodyText, SectionTitle } from '../core/design-system/Typography';
import { PageShell, RoomContent } from '../core/design-system/Layout';
import { fadeInUp, staggerContainer, scaleIn } from '../core/physics/motionPrimitives';

// API & Types
import { ApiError } from '../core/api/client';
import { AuthNotice } from '../core/auth/AuthNotice';
import { getReport } from '../services/reportService';
import type { Report } from '../types/api';
```

### Internal State
```typescript
const [report, setReport] = useState<Report | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [isUnauthorized, setIsUnauthorized] = useState(false);
```

### Derived Values
```typescript
const { sessionId } = useParams<{ sessionId: string }>();
const navigate = useNavigate();

// Quadrant position calculation
const MAX_DIFF = 40;
const x = report.raw.AERO !== null ? Math.max(-1, Math.min(1, -(report.raw.AERO) / MAX_DIFF)) : 0;
const y = report.raw.ACCE !== null ? Math.max(-1, Math.min(1, -(report.raw.ACCE) / MAX_DIFF)) : 0;
```

## Styling Strategy

### Layout
- Uses CSS Grid for responsive 2-column layout
- `grid-cols-1` on mobile, `lg:grid-cols-2` on desktop
- Gap of 8 units between cards
- Max width constrained to `6xl` (1152px)

### Cards
- All cards use `GlassMaterial` component
- Intensity variants: "high" for important cards
- Consistent padding (p-6, p-8)
- Border-left accent on primary style card

### Typography
- Consistent size hierarchy
- White with varying opacity for hierarchy
- Font-mono for numerical values
- Proper line-height for readability

### Colors
- Amber (#F59E0B) for accents and primary actions
- White with opacity for text hierarchy
- Red (#EF4444) for errors
- Transparent backgrounds with backdrop-blur

### Spacing
- Consistent gap values (4, 6, 8, 12)
- Proper padding hierarchy (p-4, p-6, p-8)
- Margins for visual breathing room
- Responsive spacing adjustments

## Performance Optimizations

### Rendering
- Conditional rendering prevents unnecessary DOM nodes
- Null checks early to avoid re-renders
- Motion components only animate on mount

### Data Fetching
- Single API call on mount
- No refetching unless sessionId changes
- Error states prevent repeated calls

### Animations
- GPU-accelerated transforms
- RequestAnimationFrame for smooth 60fps
- Stagger delays for perceived performance
- Spring physics for natural motion

## Error Boundaries

### Handled Errors
- 401 Unauthorized → AuthNotice with login
- 403 Forbidden → Error card with message
- 404 Not Found → Error card with helpful message
- Network errors → Generic error message
- Invalid sessionId → Error message

### Graceful Degradation
- Missing percentiles → Section hidden
- Missing LFI → Section hidden
- Null scores → Field hidden
- Missing style detail → Section hidden
- Partial data → Shows what's available

## Accessibility Features

### Screen Reader Support
- Semantic HTML (`h1`, `h2`, etc.)
- Descriptive labels for all data
- Loading state announced
- Error messages clear and actionable

### Keyboard Navigation
- All interactive elements focusable
- Proper tab order
- Enter/Space for buttons
- Escape to dismiss (if modals added)

### Visual Accessibility
- High contrast text
- Large touch targets (min 44px)
- Clear focus indicators
- No color-only information
- Scalable text (rem units)

## Testing Strategy

### Unit Tests (Potential)
- [ ] Component renders without crashing
- [ ] Loading state displays correctly
- [ ] Error states display correctly
- [ ] Success state displays all data
- [ ] Null checks work properly
- [ ] Navigation functions work

### Integration Tests (Potential)
- [ ] API integration works
- [ ] Route params parsed correctly
- [ ] Error handling works end-to-end
- [ ] Authentication flow works

### E2E Tests (Potential)
- [ ] Full user flow from login to report
- [ ] Error recovery flows
- [ ] Responsive behavior
- [ ] Animation performance

## Browser Compatibility

### Tested
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Features
- CSS Grid (widely supported)
- backdrop-filter (modern browsers)
- Framer Motion (polyfilled)
- ES6+ (transpiled)

### Fallbacks
- CSS Grid → Flexbox (auto-fallback)
- backdrop-filter → solid background
- Animations → none (graceful degradation)
