# KLSI 4.0 - Testing Documentation

## Overview

Test suite lengkap untuk KLSI 4.0 Frontend menggunakan Vitest dan React Testing Library.

## Struktur Testing

```
tests/
├── setup.ts                      # Global test setup dan mocks
├── utils/                        # Unit tests untuk utility functions
│   └── apiHelper.test.ts
├── hooks/                        # Unit tests untuk custom hooks
│   └── useLocalStorage.test.ts
└── integration/                  # Integration tests
    ├── LoginFlow.test.tsx
    └── AssessmentFlow.test.tsx
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Run with Coverage
```bash
npm run test:coverage
```

### Run with UI
```bash
npm run test:ui
```

### Watch Mode
```bash
npm test -- --watch
```

## Test Guidelines

### Unit Tests
- Focus on testing individual functions and hooks
- Mock external dependencies
- Test edge cases and error handling
- Aim for 80%+ code coverage

### Integration Tests
- Test user flows end-to-end
- Mock API calls, not internal functions
- Test accessibility (ARIA attributes, keyboard navigation)
- Test error states and loading states

### Best Practices
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Clear naming**: Test names should describe what is being tested
3. **Mock judiciously**: Only mock what's necessary
4. **Test behavior, not implementation**: Focus on user-facing behavior
5. **Accessibility**: Always test ARIA attributes and keyboard navigation

## Coverage Goals

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

## Accessibility Testing

All integration tests include accessibility checks:
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader compatibility

## CI/CD Integration

Tests run automatically on:
- Every push to main/develop
- Every pull request
- Before deployment

## Troubleshooting

### Common Issues

**Issue**: `localStorage is not defined`
**Solution**: Check that `tests/setup.ts` is properly configured

**Issue**: `window.matchMedia is not defined`
**Solution**: Verify mock in setup file

**Issue**: Tests timeout
**Solution**: Increase timeout in vitest.config.ts

## Writing New Tests

### Example Unit Test
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../utils/myFunction';

describe('myFunction', () => {
  it('should return expected value', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Example Integration Test
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

it('should handle user interaction', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);
  
  const button = screen.getByRole('button');
  await user.click(button);
  
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
