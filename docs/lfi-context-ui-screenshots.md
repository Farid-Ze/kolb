# LFI Context UI - Example Screenshots

This document shows what the enhanced UI looks like through detailed descriptions and code examples.

## Screenshot 1: Initial State - No Rankings

**Context**: Starting Something New  
**Status**: No ranks selected yet

```
╔═══════════════════════════════════════════════════════════════╗
║ ACTIVE EXPERIMENTATION                                        ║
║                                                               ║
║ Rank the endings for each sentence                           ║
║ (1 = Least like you, 4 = Most like you)                     ║
╚═══════════════════════════════════════════════════════════════╝

┌────────────────────────────── Progress Bar ───────────────────┐
│ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░  40% (8/20)     │
└───────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║ Question 8 of 20                                     Context  ║
║                                                               ║
║ • LEARNING FLEXIBILITY CONTEXT                                ║
║                                                               ║
║ Starting Something New                                        ║
║ How you approach initiating new projects or activities       ║
║                                                               ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ Instructions: Rank how you typically approach this     │  ║
║ │ situation using each learning mode.                    │  ║
║ │ 1 = Least like you, 4 = Most like you                 │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ [CE - Feeling]                                          │  ║
║ │ By feeling and sensing new experiences                  │  ║
║ │                                   [1] [2] [3] [4]       │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ [RO - Watching]                                         │  ║
║ │ By watching and listening carefully                     │  ║
║ │                                   [1] [2] [3] [4]       │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ [AC - Thinking]                                         │  ║
║ │ By thinking and analyzing logically                     │  ║
║ │                                   [1] [2] [3] [4]       │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ [AE - Doing]                                            │  ║
║ │ By doing and experimenting actively                     │  ║
║ │                                   [1] [2] [3] [4]       │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ [Previous]                                  [Next]      │  ║
║ │                                             (disabled)  │  ║
║ └─────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════╝
```

All rank buttons are white/transparent with light borders.  
Next button is grayed out (disabled).

---

## Screenshot 2: Partial Ranking - Validation Error

**Context**: Starting Something New  
**Status**: User has selected ranks for CE and RO only

```
╔═══════════════════════════════════════════════════════════════╗
║ Question 8 of 20                                     Context  ║
║                                                               ║
║ • LEARNING FLEXIBILITY CONTEXT                                ║
║                                                               ║
║ Starting Something New                                        ║
║ How you approach initiating new projects or activities       ║
║                                                               ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ [CE - Feeling]                                          │  ║
║ │ By feeling and sensing new experiences                  │  ║
║ │                                   [4] [2] [3] [1]       │  ║
║ │                                    ↑                    │  ║
║ │                                 SELECTED (amber)        │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ [RO - Watching]                                         │  ║
║ │ By watching and listening carefully                     │  ║
║ │                                   [4] [2] [3] [1]       │  ║
║ │                                   X    ↑           X    │  ║
║ │                             disabled amber    disabled  │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ [AC - Thinking]                                         │  ║
║ │ By thinking and analyzing logically                     │  ║
║ │                                   [4] [2] [3] [1]       │  ║
║ │                                   X    X           X    │  ║
║ │                              All ranks 4,3,1 disabled  │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ [AE - Doing]                                            │  ║
║ │ By doing and experimenting actively                     │  ║
║ │                                   [4] [2] [3] [1]       │  ║
║ │                                   X    X           X    │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ ⚠ Incomplete Ranking                                    │  ║
║ │ • All four learning modes must be ranked                │  ║
║ │ • Each rank (1-4) must be used exactly once             │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║ [Previous]                                      [Next]        ║
║                                               (disabled)      ║
╚═══════════════════════════════════════════════════════════════╝
```

- CE has rank 4 (amber button, scaled up, with shadow)
- RO has rank 3 (amber button)
- AC and AE have no ranks yet
- Ranks 4, 3, and 1 are disabled (grayed out) for AC and AE
- Only rank 2 is available for AC and AE
- Red error message shows validation issues
- Next button still disabled

---

## Screenshot 3: Complete Ranking - Success

**Context**: Starting Something New  
**Status**: All 4 options have unique ranks 1-4

```
╔═══════════════════════════════════════════════════════════════╗
║ Question 8 of 20                                     Context  ║
║                                                               ║
║ • LEARNING FLEXIBILITY CONTEXT                                ║
║                                                               ║
║ Starting Something New                                        ║
║ How you approach initiating new projects or activities       ║
║                                                               ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ [CE - Feeling]                                          │  ║
║ │ By feeling and sensing new experiences                  │  ║
║ │                                   [4] [2] [3] [1]       │  ║
║ │                                    ↑                    │  ║
║ │                                 AMBER                   │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ [RO - Watching]                                         │  ║
║ │ By watching and listening carefully                     │  ║
║ │                                   [4] [2] [3] [1]       │  ║
║ │                                        ↑                │  ║
║ │                                     AMBER               │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ [AC - Thinking]                                         │  ║
║ │ By thinking and analyzing logically                     │  ║
║ │                                   [4] [2] [3] [1]       │  ║
║ │                                             ↑           │  ║
║ │                                          AMBER          │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ [AE - Doing]                                            │  ║
║ │ By doing and experimenting actively                     │  ║
║ │                                   [4] [2] [3] [1]       │  ║
║ │                                                     ↑   │  ║
║ │                                                  AMBER  │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ ✓ Context ranking complete!                             │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║ [Previous]                                     [Next ➜]       ║
║                                                 AMBER         ║
╚═══════════════════════════════════════════════════════════════╝
```

Rankings:
- CE: rank 4 (Most like you)
- RO: rank 3
- AC: rank 2
- AE: rank 1 (Least like you)

All ranks are unique (1, 2, 3, 4).  
Green success message appears.  
Next button is enabled with amber background and glow.

---

## Screenshot 4: Mobile View - Complete Ranking

**Device**: Mobile (375px width)  
**Context**: Getting To Know Someone

```
┌───────────────────────────────┐
│ ACTIVE EXPERIMENTATION        │
│                               │
│ Rank the endings...           │
└───────────────────────────────┘

┌───────────────────────────────┐
│ ████████████░░░░░  60% (12/20)│
└───────────────────────────────┘

╔═══════════════════════════════╗
║ Question 12 of 20     Context ║
║                               ║
║ • LEARNING FLEXIBILITY        ║
║                               ║
║ Getting To Know Someone       ║
║ How you build                 ║
║ relationships with            ║
║ new people                    ║
║                               ║
║ ┌───────────────────────────┐ ║
║ │ Instructions: Rank how    │ ║
║ │ you typically approach... │ ║
║ │ 1 = Least, 4 = Most      │ ║
║ └───────────────────────────┘ ║
║                               ║
║ ┌───────────────────────────┐ ║
║ │ [CE - Feeling]            │ ║
║ │                           │ ║
║ │ By being warm and         │ ║
║ │ approachable              │ ║
║ │                           │ ║
║ │ [1] [2] [3] [4]          │ ║
║ │              ↑            │ ║
║ │           AMBER           │ ║
║ └───────────────────────────┘ ║
║                               ║
║ ┌───────────────────────────┐ ║
║ │ [RO - Watching]           │ ║
║ │                           │ ║
║ │ By observing and          │ ║
║ │ listening first           │ ║
║ │                           │ ║
║ │ [1] [2] [3] [4]          │ ║
║ │      ↑                    │ ║
║ │   AMBER                   │ ║
║ └───────────────────────────┘ ║
║                               ║
║ ┌───────────────────────────┐ ║
║ │ [AC - Thinking]           │ ║
║ │                           │ ║
║ │ By asking thoughtful      │ ║
║ │ questions                 │ ║
║ │                           │ ║
║ │ [1] [2] [3] [4]          │ ║
║ │  ↑                        │ ║
║ │ AMBER                     │ ║
║ └───────────────────────────┘ ║
║                               ║
║ ┌───────────────────────────┐ ║
║ │ [AE - Doing]              │ ║
║ │                           │ ║
║ │ By initiating             │ ║
║ │ conversations             │ ║
║ │                           │ ║
║ │ [1] [2] [3] [4]          │ ║
║ │          ↑                │ ║
║ │        AMBER              │ ║
║ └───────────────────────────┘ ║
║                               ║
║ ┌───────────────────────────┐ ║
║ │ ✓ Context ranking         │ ║
║ │   complete!               │ ║
║ └───────────────────────────┘ ║
║                               ║
║ [Previous]        [Next ➜]   ║
║                    AMBER      ║
╚═══════════════════════════════╝
```

Mobile features:
- Vertical stacking of all elements
- Learning mode badge above option text
- Rank buttons below option text
- Large touch-friendly buttons (48x48px)
- Responsive text sizing
- All features preserved

---

## Color Legend

**Amber (#F59E0B)**: Selected ranks, enabled Next button, context indicator  
**Emerald (#10B981)**: Success messages, completion feedback  
**Red (#EF4444)**: Error messages, validation warnings  
**White/Transparent**: Unselected buttons, glass panels  
**Gray**: Disabled buttons, muted text

## Animation Notes

1. **Context card enter/exit**: Slides with fade (200ms)
2. **Rank selection**: Scale up animation (150ms)
3. **Validation messages**: Fade in with height expand (200ms)
4. **Button hover**: Smooth color transition (100ms)
5. **Progress bar**: Spring animation (500ms)

All animations respect `prefers-reduced-motion` setting.
