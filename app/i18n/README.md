# i18n Module: Internationalization & Localization

## Overview

This module centralizes all Indonesian text constants used across the KLSI application for consistent localization and easy maintenance.

## Purpose

- **Single Source of Truth**: All user-facing Indonesian messages are defined here
- **Consistent Localization**: Ensures uniform terminology across the application
- **Easy Maintenance**: Update translations in one place
- **Locale Fallback Validation**: Prevents untranslated strings from appearing to users

## Module Structure

### `id_messages.py`
Contains all Indonesian message constants organized by domain:

- **DomainErrorMessages**: Base error default messages
- **SessionErrorMessages**: Session-related errors
- **ValidationMessages**: Validation feedback texts
- **BatchPayloadMessages**: Batch submission validation
- **TeamMessages**: Team management messages
- **ResearchMessages**: Research study management
- **AuthMessages**: Authentication flow errors
- **AdminMessages**: Administration-specific messages
- **AuthorizationMessages**: Authorization-related messages
- **PipelineMessages**: Pipeline service messages
- **EngineMessages**: Engine service and router localization
- **AuthoringMessages**: Authoring spec validation
- **SecurityMessages**: Security and authentication headers
- **KLSI4Messages**: Instrument-specific localization for KLSI 4.0
- **ReportMessages**: Report generation and analytics
- **StrategyMessages**: Strategy registry errors
- **And many more specialized message classes...**

### `id_styles.py`
Contains Indonesian translations for learning styles:

- **STYLE_LABELS_ID**: Style names (e.g., "MemBayangkan (Imagining)")
- **STYLE_BRIEF_ID**: Brief style descriptions
- **STYLE_DETAIL_ID**: Detailed style explanations including:
  - Overview
  - Strengths
  - Challenges
  - Learning tips
  - Preferred learning spaces
  - How others view the style
- **EDUCATOR_RECO_ID**: Educator recommendations
- **LFI_LABEL_ID**: Learning Flexibility Index labels

## Usage Patterns

### In Domain Errors

```python
from app.i18n.id_messages import DomainErrorMessages

class ValidationError(DomainError):
    default_message = DomainErrorMessages.VALIDATION_ERROR
```

### In Service/Router Code

```python
from app.i18n.id_messages import SessionErrorMessages

if not session:
    raise HTTPException(404, detail=SessionErrorMessages.NOT_FOUND)
```

### In Engine Code

```python
from app.i18n.id_messages import EngineMessages

raise ConfigurationError(EngineMessages.MANIFEST_NOT_CONFIGURED)
```

### String Formatting

Many messages support string formatting:

```python
from app.i18n.id_messages import LogicMessages

error = LogicMessages.LFI_CONTEXT_COUNT_MISMATCH.format(
    expected=8, 
    found=len(contexts)
)
```

## Best Practices

### DO:
✅ Use centralized message constants for all user-facing text
✅ Add new message classes when introducing new domains
✅ Use descriptive constant names (e.g., `SESSION_NOT_FOUND`)
✅ Support string formatting with `{variable}` placeholders
✅ Group related messages into logical classes

### DON'T:
❌ Hardcode Indonesian strings directly in code
❌ Mix English and Indonesian in the same error message
❌ Create duplicate message constants across different classes
❌ Use magic strings for error messages
❌ Scatter localization logic throughout the codebase

## Adding New Messages

When adding a new feature that requires Indonesian text:

1. **Identify the Domain**: Determine which message class fits best
2. **Add Constant**: Add the constant to the appropriate class
3. **Use in Code**: Import and use the constant instead of hardcoding
4. **Test**: Verify the message displays correctly to end users

Example:

```python
# 1. Add to id_messages.py
class NewFeatureMessages:
    """Messages for new feature X."""
    
    FEATURE_ENABLED: str = "Fitur X telah diaktifkan"
    FEATURE_ERROR: str = "Gagal mengaktifkan fitur X: {reason}"

# 2. Use in code
from app.i18n.id_messages import NewFeatureMessages

if success:
    return {"message": NewFeatureMessages.FEATURE_ENABLED}
else:
    raise ValueError(NewFeatureMessages.FEATURE_ERROR.format(reason=error))
```

## Locale Fallback Strategy

The application currently supports:
- **Primary**: Indonesian (ID)
- **Fallback**: English (EN) - for technical terms and psychometric labels

Technical terms like "ACCE", "AERO", "Kendall's W", and "percentile" are intentionally left in English as they are standardized psychometric terminology.

## Future Enhancements

Potential improvements for the i18n system:

1. **Multiple Languages**: Extend beyond Indonesian to support English, etc.
2. **Dynamic Loading**: Load translations from JSON/YAML files at runtime
3. **Caching**: Cache frequently accessed translations
4. **Validation**: Runtime validation that all required translations exist
5. **Pluralization**: Support plural forms (e.g., "1 item" vs "2 items")
6. **Date/Time Formatting**: Locale-aware date and time formatting

## Testing

To verify all messages are properly imported:

```bash
python -c "from app.i18n.id_messages import *; print('All message imports successful')"
python -c "from app.i18n.id_styles import *; print('All style imports successful')"
```

## Maintenance

When refactoring code:
- Search for hardcoded Indonesian strings: `grep -r '".*tidak\|harus\|gagal' app/`
- Move them to appropriate message classes
- Update code to use the constants
- Test that error paths still work correctly

## Related Documentation

- `/docs/hci_model.md` - HCI principles for user-facing text
- `/docs/psychometrics_spec.md` - Psychometric terminology standards
- `app/core/errors.py` - Domain error hierarchy using these messages
