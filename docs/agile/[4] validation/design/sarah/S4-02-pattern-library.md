# S4-02: UX Pattern Library

## 📋 METADATA
- **Task ID**: S4-02
- **Persona**: Sarah Putri W. (UI/UX Designer)
- **Sprint**: 4 - Validation & Handoff
- **Status**: ✅ COMPLETED
- **Created**: 2025-12-11
- **Dependencies**: S3-02, N3-01, AM4-03

---

## 🎯 OBJECTIVE

Document comprehensive UX patterns for Zenotika WebGL experiential projects ensuring consistent, intuitive user experiences.

---

## 📖 UX PATTERN LIBRARY

### 1. Navigation Patterns

#### Scroll-Based Navigation

**Pattern**: Progressive Reveal
- Content reveals as user scrolls
- Visual indicators show progress
- Smooth transitions between sections

**Implementation**:
```
┌──────────────────────────────────────┐
│  [Logo]              [Menu] [Audio]  │
├──────────────────────────────────────┤
│                                      │
│         [3D Scene Content]           │
│                                      │
├──────────────────────────────────────┤
│     Progress: ●○○○○  Scene 1/5       │
│          ↓ Scroll to continue        │
└──────────────────────────────────────┘
```

**Guidelines**:
- Show progress indicator (dots, bar, or percentage)
- Provide scroll affordance (arrow, text hint)
- Allow skipping to specific sections
- Support keyboard navigation (Arrow keys)

#### Fixed Navigation

**Pattern**: Persistent Header
- Always visible, minimal design
- Transforms on scroll (compact mode)
- Contains essential actions only

**Behavior**:
| State | Header Height | Background | Content |
|-------|--------------|------------|---------|
| Top | 80px | Transparent | Full logo, nav |
| Scrolled | 60px | Semi-transparent | Compact logo, nav |
| Mobile | 60px | Solid | Hamburger menu |

### 2. Loading Patterns

#### Initial Load

**Pattern**: Branded Loading Experience
- Show progress with brand elements
- Communicate what's loading
- Provide estimated time

**States**:
```
State 1: Initializing (0-20%)
┌──────────────────────────────────────┐
│                                      │
│           [Brand Logo]               │
│                                      │
│       ████████░░░░░░░░░░  40%       │
│       Loading 3D experience...       │
│                                      │
└──────────────────────────────────────┘

State 2: Loading Assets (20-80%)
┌──────────────────────────────────────┐
│                                      │
│           [Brand Logo]               │
│                                      │
│       ████████████░░░░░░  65%       │
│       Preparing scenes...            │
│                                      │
└──────────────────────────────────────┘

State 3: Ready (100%)
┌──────────────────────────────────────┐
│                                      │
│           [Brand Logo]               │
│                                      │
│       ████████████████  Ready!       │
│       [Enter Experience]             │
│                                      │
└──────────────────────────────────────┘
```

#### Progressive Loading

**Pattern**: Content-First Loading
- Show content as it loads
- Low-quality placeholders upgrade
- Don't block interaction

### 3. Interaction Patterns

#### Scroll Interactions

**Pattern**: Scroll-Triggered Animations
| Trigger Point | Animation | Duration |
|---------------|-----------|----------|
| Element enters viewport | Fade in | 300ms |
| Element 50% visible | Full animation | 500ms |
| Element exits viewport | Optional fade | 200ms |

**Guidelines**:
- Animations should enhance, not distract
- One animation per scroll position
- Respect reduced motion preference
- Provide skip option for long sequences

#### Hover Interactions

**Pattern**: Informative Hover States
- Show additional information
- Indicate interactivity
- Provide visual feedback

**States**:
| State | Visual Change | Purpose |
|-------|--------------|---------|
| Default | Base appearance | Normal state |
| Hover | Highlight, cursor change | Show interactivity |
| Active | Pressed appearance | Confirm action |
| Focus | Outline | Keyboard navigation |

#### Touch Interactions

**Pattern**: Touch-First Design
- Larger touch targets (48px)
- No hover-dependent information
- Swipe gestures for navigation
- Pinch-to-zoom where appropriate

### 4. Form Patterns

#### Lead Capture Form

**Pattern**: Progressive Form
- Show fields one at a time or in groups
- Validate inline, not on submit
- Provide helpful error messages

**Field Order**:
1. Name (quick win, low friction)
2. Email (value exchange clear)
3. Company (context for follow-up)
4. Message (optional, shows interest)

**Validation UX**:
```
Valid State:
┌──────────────────────────────────────┐
│ Email                                │
│ ┌────────────────────────────────┐   │
│ │ john@company.com          [✓] │   │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘

Error State:
┌──────────────────────────────────────┐
│ Email                                │
│ ┌────────────────────────────────┐   │
│ │ john@invalid             [!]  │   │
│ └────────────────────────────────┘   │
│ Please enter a valid email address   │
└──────────────────────────────────────┘
```

#### Form Success

**Pattern**: Confirmation with Next Steps
- Clear success message
- Set expectations (response time)
- Provide alternative actions

### 5. Error Patterns

#### WebGL Errors

**Pattern**: Graceful Degradation
- Detect capability before attempting
- Show helpful message, not technical error
- Provide alternative experience

**Error Message Guidelines**:
| ❌ Don't | ✅ Do |
|----------|-------|
| "WebGL context lost" | "Experience interrupted. Refreshing..." |
| "Error: shader compilation failed" | "Loading alternative view..." |
| "null is not an object" | "Something went wrong. Try refreshing." |

#### Network Errors

**Pattern**: Retry with Feedback
- Detect connection issues
- Show current status
- Auto-retry with exponential backoff
- Provide manual retry option

### 6. Empty & Waiting States

#### Loading States

**Pattern**: Skeleton Screens
- Show structure of coming content
- Subtle animation indicates loading
- Transition smoothly to real content

#### Empty States

**Pattern**: Helpful Empty States
- Explain why it's empty
- Suggest actions
- Use friendly illustration/icon

### 7. Accessibility Patterns

#### Screen Reader Navigation

**Pattern**: Landmark Navigation
```html
<header role="banner">...</header>
<nav role="navigation">...</nav>
<main role="main">...</main>
<footer role="contentinfo">...</footer>
```

#### Focus Management

**Pattern**: Focus Trap for Modals
- Focus moves to modal when opened
- Tab cycles within modal
- Focus returns to trigger on close

#### Announcements

**Pattern**: Live Region Updates
```html
<div aria-live="polite" aria-atomic="true">
  <!-- Dynamic updates announced to screen readers -->
  Scene 2 of 5: Corn growth phase
</div>
```

---

## ✅ UX PATTERN CHECKLIST

### Navigation
- [ ] Clear progress indication
- [ ] Scroll affordances
- [ ] Keyboard navigation
- [ ] Mobile-friendly navigation

### Loading
- [ ] Branded loading experience
- [ ] Progress communication
- [ ] Progressive loading

### Interaction
- [ ] Hover states defined
- [ ] Touch interactions designed
- [ ] Reduced motion alternative

### Forms
- [ ] Inline validation
- [ ] Clear error messages
- [ ] Success confirmation

### Errors
- [ ] Graceful error handling
- [ ] User-friendly messages
- [ ] Recovery options

---

## 📚 CROSS-REFERENCES

| Document | Content |
|----------|---------|
| S4-01 | UI design system |
| S4-03 | Animation reference |
| N4-01 | UX playbook |
| AM4-03 | Inclusive design |

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| UX patterns | ✅ VERIFIED | Industry best practices |
| Touch targets | ✅ VERIFIED | Apple/Google HIG |
| Accessibility | ✅ VERIFIED | WAI-ARIA practices |

---

**Document Status**: ✅ COMPLETED  
**Last Updated**: 2025-12-11  
**Owner**: Sarah Putri W. (UI/UX Designer)
