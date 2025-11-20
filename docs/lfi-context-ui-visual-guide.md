# LFI Context UI - Visual Guide

This document provides a visual description of the enhanced LFI context UI components.

## UI Components Overview

### 1. Context Header
```
┌─────────────────────────────────────────────────────────────┐
│ • LEARNING FLEXIBILITY CONTEXT                              │
│                                                               │
│ Starting Something New                                        │
│ How you approach initiating new projects or activities       │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Animated amber indicator dot
- Large, bold context name in Title Case
- Descriptive subtitle explaining what the context measures
- Distinct visual separation from instructions

### 2. Instructions Box
```
┌─────────────────────────────────────────────────────────────┐
│ Instructions: Rank how you typically approach this          │
│ situation using each learning mode. 1 = Least like you,     │
│ 4 = Most like you                                            │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Highlighted "Instructions:" label in amber
- Clear ranking guidance
- Light background for emphasis

### 3. Learning Mode Ranking Options
```
┌─────────────────────────────────────────────────────────────┐
│ [CE - Feeling]  By feeling and sensing new experiences      │
│                                           [1] [2] [3] [4]    │
├─────────────────────────────────────────────────────────────┤
│ [RO - Watching] By watching and listening carefully         │
│                                           [1] [2] [3] [4]    │
├─────────────────────────────────────────────────────────────┤
│ [AC - Thinking] By thinking and analyzing logically         │
│                                           [1] [2] [3] [4]    │
├─────────────────────────────────────────────────────────────┤
│ [AE - Doing]    By doing and experimenting actively         │
│                                           [1] [2] [3] [4]    │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Each option has a learning mode badge (CE/RO/AC/AE with descriptor)
- Clear option text
- 4 rank buttons (1-4) aligned to the right
- Responsive layout: vertical on mobile, horizontal on desktop

### 4. Rank Button States

#### Unselected (Available)
```
┌───┐
│ 1 │  ← White/transparent background, light border
└───┘
```

#### Selected
```
┌───┐
│ 1 │  ← Amber background, black text, shadow, scaled up
└───┘
```

#### Disabled (Used by Another Option)
```
┌───┐
│ 1 │  ← Grayed out, not clickable
└───┘
```

### 5. Validation Feedback

#### Incomplete Ranking (Error)
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠ Incomplete Ranking                                         │
│ • All four learning modes must be ranked                     │
│ • Each rank (1-4) must be used exactly once                  │
└─────────────────────────────────────────────────────────────┘
```
- Red background with red border
- Warning icon
- List of specific errors

#### Complete Ranking (Success)
```
┌─────────────────────────────────────────────────────────────┐
│ ✓ Context ranking complete!                                  │
└─────────────────────────────────────────────────────────────┘
```
- Green background with green border
- Checkmark icon
- Encouraging message

### 6. Navigation Buttons
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  [Previous]                                       [Next]     │
│                                                     ↑         │
│                                              Amber when       │
│                                              ranking complete │
└─────────────────────────────────────────────────────────────┘
```

## User Flow

### Step 1: Initial State
- All rank buttons available (white/transparent)
- No validation feedback
- Next button disabled (grayed out)

### Step 2: User Starts Ranking
- User clicks rank "1" for CE - Feeling
- Button turns amber, scales up
- All other options' rank "1" buttons become disabled
- Validation error appears (incomplete ranking)

### Step 3: User Continues
- User selects ranks for remaining options
- As each rank is selected:
  - Selected button highlights
  - Same rank disabled for other options
  - Validation updates

### Step 4: Ranking Complete
- All 4 options have unique ranks 1-4
- Green success message appears
- Next button becomes enabled (amber)
- User can proceed to next context

## Responsive Design

### Mobile View
```
┌──────────────────────┐
│ Context Name         │
│ Description...       │
│                      │
│ [CE - Feeling]       │
│ Option text...       │
│ [1] [2] [3] [4]      │
│                      │
│ [RO - Watching]      │
│ Option text...       │
│ [1] [2] [3] [4]      │
│                      │
│ (etc.)               │
└──────────────────────┘
```

### Desktop View
```
┌────────────────────────────────────────────────────────┐
│ Context Name                                           │
│ Description...                                         │
│                                                        │
│ [CE - Feeling]   Option text...      [1] [2] [3] [4]  │
│ [RO - Watching]  Option text...      [1] [2] [3] [4]  │
│ [AC - Thinking]  Option text...      [1] [2] [3] [4]  │
│ [AE - Doing]     Option text...      [1] [2] [3] [4]  │
└────────────────────────────────────────────────────────┘
```

## Color Scheme

- **Primary Accent**: Amber (#F59E0B) - Selected states, highlights
- **Success**: Emerald (#10B981) - Completion feedback
- **Error**: Red (#EF4444) - Validation errors
- **Background**: White with transparency (glass morphism)
- **Text**: White with varying opacity for hierarchy
- **Borders**: White with low opacity

## Accessibility Features

- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation support
- ✅ Clear focus indicators
- ✅ Screen reader friendly text
- ✅ Sufficient color contrast
- ✅ Touch-friendly button sizes (48x48px minimum)

## Animation & Motion

- Context cards slide in/out with fade
- Validation messages fade in/out with height animation
- Rank buttons scale on selection
- Smooth transitions on all state changes
- Respects reduced motion preferences
