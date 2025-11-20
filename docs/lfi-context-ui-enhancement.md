# LFI Context UI Enhancement

This document describes the enhanced UI for Learning Flexibility Index (LFI) context items in the ActiveExperimentationRoom.

## Overview

The LFI context UI has been enhanced to provide a richer, more user-friendly experience for ranking context items compared to the basic style items.

## Components

### 1. Context Helpers (`/frontend/src/utils/contextHelpers.ts`)

Utility functions for context display and validation:

- **`formatContextName(contextName: string)`**: Converts snake_case context names to Title Case
- **`getContextInfo(contextName: string)`**: Returns display name and description for each context
- **`validateContextRanks(ranks: Record<number, number>)`**: Validates that ranks are complete and unique (1-4)
- **`getLearningModeLabel(mode: string)`**: Returns formatted labels for learning modes (e.g., "CE - Feeling")

### 2. LFI Context Card (`/frontend/src/components/assessment/LFIContextCard.tsx`)

A dedicated component for rendering LFI context items with:

- **Context Header**: Displays the context name in human-readable format
- **Description**: Explains what the context measures
- **Instructions**: Clear guidance on how to rank (1 = Least like you, 4 = Most like you)
- **Learning Mode Options**: Each option shows:
  - Mode label (e.g., "CE - Feeling")
  - Option text
  - Rank buttons (1-4)
- **Smart Validation**:
  - Rank buttons for already-used ranks are disabled
  - Real-time validation feedback
  - Error messages for incomplete or duplicate rankings
  - Success message when ranking is complete
- **Responsive Design**: Works on mobile and desktop

### 3. Updated ActiveExperimentationRoom

The main assessment scene now differentiates between:

- **Learning Style items**: Uses the existing simple ranking UI
- **Learning Flexibility items**: Uses the enhanced LFIContextCard component

## Features

### Context Descriptions

Each of the 8 LFI contexts has a descriptive explanation:

1. **Starting Something New**: How you approach initiating new projects or activities
2. **Influencing Someone**: Your strategy when trying to persuade or influence others
3. **Getting To Know Someone**: How you build relationships with new people
4. **Learning In A Group**: Your preferred approach when learning with others
5. **Planning Something**: How you organize and prepare for future activities
6. **Analyzing Something**: Your method for breaking down and understanding complex information
7. **Evaluating An Opportunity**: How you assess new possibilities or chances
8. **Choosing Between Alternatives**: Your decision-making process when faced with options

### Validation

The UI enforces proper ranking:

- All 4 learning modes must be ranked
- Each rank (1-4) must be used exactly once
- Duplicate ranks are prevented through disabled buttons
- Real-time feedback shows completion status

### User Experience

- **Visual Feedback**: 
  - Selected ranks are highlighted in amber with shadow
  - Used ranks are disabled with reduced opacity
  - Validation messages appear inline
- **Accessibility**:
  - Proper ARIA labels on rank buttons
  - Keyboard navigation support
  - Screen reader friendly
- **Mobile Responsive**:
  - Flexible layout that adapts to screen size
  - Touch-friendly button sizes

## Data Flow

1. **Backend** sends items via `GET /sessions/{session_id}/items` with `category` field for context names
2. **Frontend** renders items using either:
   - Standard UI for `type === 'Learning_Style'`
   - LFIContextCard for `type === 'Learning_Flexibility'`
3. **User** ranks each learning mode (CE, RO, AC, AE) from 1-4
4. **Validation** ensures complete and unique rankings before allowing navigation
5. **Submission** maps rankings to `ContextRank` objects via `buildSubmissionPayload()`
6. **Backend** receives via `POST /sessions/{session_id}/submit_all_responses`

## Testing

### Unit Tests
- `contextHelpers.test.ts`: 12 tests for utility functions
- `LFIContextCard.test.tsx`: 7 tests for component behavior

All tests passing (19/19).

## Future Enhancements

Potential improvements:
- Add animated transitions between contexts
- Include example scenarios for each context
- Persist rankings in local storage for recovery
- Add progress indicator for context completion
- Support for internationalization (i18n)
