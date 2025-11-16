# Common Components - KLSI 4.0

Dokumentasi komponen-komponen UI reusable yang mengikuti Guidelines.md "Liquid Glass" Design System.

## Components Overview

### AppShell
Layout wrapper dengan Liquid Glass Header & Navigation
- **File**: `AppShell.tsx`
- **Usage**: Wrap halaman dengan navigasi lengkap
- **Features**:
  - Responsive navigation (desktop + mobile)
  - User info & logout
  - Theme toggle terintegrasi
  - Spring-based animations

```tsx
import { AppShell } from './components/common';

<AppShell showSidebar={true}>
  <YourPageContent />
</AppShell>
```

### Button
Komponen tombol dengan variants dan states
- **File**: `Button.tsx`
- **Variants**: primary, secondary, destructive, outline, ghost
- **Sizes**: sm, md, lg
- **Features**:
  - Loading state
  - Disabled state
  - Spring-based hover/active animations
  - Focus-visible accessibility

```tsx
import { Button } from './components/common';

<Button variant="primary" size="md" loading={false}>
  Submit
</Button>
```

### Input
Input field dengan error states
- **File**: `Input.tsx`
- **Features**:
  - Label & helper text
  - Error messages dengan icon
  - Left/right icon support
  - Accessible (aria-invalid, aria-describedby)

```tsx
import { Input } from './components/common';

<Input
  label="Email"
  error={errors.email}
  helperText="Enter your email address"
  leftIcon={<Mail className="h-5 w-5" />}
/>
```

### Select
Dropdown select dengan styling konsisten
- **File**: `Select.tsx`
- **Features**:
  - Native select (optimal accessibility)
  - Error states
  - Placeholder support
  - Custom chevron icon

```tsx
import { Select } from './components/common';

<Select
  label="Country"
  options={[
    { value: 'id', label: 'Indonesia' },
    { value: 'sg', label: 'Singapore' }
  ]}
  placeholder="Select a country"
/>
```

### Modal
Modal dialog dengan Liquid Glass styling
- **File**: `Modal.tsx`
- **Features**:
  - Backdrop dimming layer
  - Escape key to close
  - Focus trap
  - Size variants (sm, md, lg, xl)
  - Reduce motion fallback

```tsx
import { Modal } from './components/common';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

### Toast
System-wide notification dengan Sonner
- **File**: `Toast.tsx`
- **Features**:
  - Success, error, warning, info variants
  - Liquid Glass styling
  - Auto-dismiss
  - Action buttons support

```tsx
import { toast } from 'sonner@2.0.3';

// In your App.tsx, add:
import { Toaster } from './components/common';
<Toaster />

// Then anywhere in your app:
toast.success('Profile updated successfully!');
toast.error('Failed to save changes');
toast.warning('Session will expire soon');
toast.info('New features available');
```

### ThemeToggle
Toggle between light/dark mode
- **File**: `ThemeToggle.tsx`
- **Features**:
  - System preference detection
  - Animated icon transition
  - Accessible (aria-label)

```tsx
import { ThemeToggle } from './components/common';

<ThemeToggle />
```

### SkeletonLoader
Loading placeholders dengan shimmer animation
- **File**: `SkeletonLoader.tsx`
- **Components**:
  - `Skeleton` - Base skeleton
  - `ReportPageSkeleton` - For report pages
  - `DashboardSkeleton` - For dashboard
  - `CardSkeleton` - Generic card skeleton
  - `TableSkeleton` - For data tables

```tsx
import { Skeleton, DashboardSkeleton } from './components/common';

// Loading state
{isLoading ? <DashboardSkeleton /> : <DashboardContent />}

// Custom skeleton
<Skeleton variant="text" width="60%" height={32} />
<Skeleton variant="circular" width={48} height={48} />
<Skeleton variant="rectangular" height={200} />
```

### ErrorBoundary
Error handling untuk React components
- **File**: `ErrorBoundary.tsx`
- **Components**:
  - `ErrorBoundary` - Full-page error UI
  - `RouteErrorBoundary` - Inline error for routes

```tsx
import { ErrorBoundary, RouteErrorBoundary } from './components/common';

// Root level (in App.tsx)
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Route level
<RouteErrorBoundary onReset={() => refetch()}>
  <YourComponent />
</RouteErrorBoundary>
```

### LoadingComponent
Global loading indicator
- **File**: `LoadingComponent.tsx`
- **Usage**: Full-page loading state

```tsx
import { LoadingComponent } from './components/common';

{isLoading && <LoadingComponent />}
```

## Design System Compliance

All components follow Guidelines.md principles:

### Layout (Bagian 1)
- Responsive design
- Safe area support
- Ergonomic touch targets
- Proper spacing (8px grid)

### Motion (Bagian 2)
- Spring-based animations
- Reduce motion fallback
- Perceived performance
- Interruptible animations

### Color (Bagian 3)
- Semantic colors (success, error, warning)
- WCAG contrast compliance
- System color adaptation
- Accessible focus states

### Material (Bagian 4)
- Liquid Glass for navigation layer
- Standard material for content layer
- Reduce transparency fallback
- Proper hierarchy

### Accessibility (Bagian 8)
- Keyboard navigation
- Screen reader support
- ARIA attributes
- Focus management
- High contrast mode support

## Usage Patterns

### Form Example
```tsx
import { Input, Select, Button } from './components/common';
import { useForm } from 'react-hook-form@7.55.0';

function MyForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Name"
        {...register('name', { required: 'Name is required' })}
        error={errors.name?.message}
      />
      
      <Select
        label="Role"
        options={roleOptions}
        {...register('role')}
        error={errors.role?.message}
      />
      
      <Button type="submit" loading={isSubmitting} fullWidth>
        Submit
      </Button>
    </form>
  );
}
```

### Page with AppShell Example
```tsx
import { AppShell } from './components/common';

export const MyPage: React.FC = () => {
  return (
    <AppShell showSidebar={true}>
      <div className="space-y-6">
        <h1>Page Title</h1>
        {/* Your content here */}
      </div>
    </AppShell>
  );
};
```

### Loading & Error States
```tsx
import { Skeleton, RouteErrorBoundary } from './components/common';
import { useQuery } from '@tanstack/react-query';

function DataView() {
  const { data, isLoading, error, refetch } = useQuery(['data'], fetchData);
  
  if (isLoading) {
    return <Skeleton height={200} />;
  }
  
  return (
    <RouteErrorBoundary onReset={() => refetch()}>
      <div>{data && <DataDisplay data={data} />}</div>
    </RouteErrorBoundary>
  );
}
```

## Testing

All components are designed with testability in mind:
- Proper ARIA labels
- Semantic HTML
- Predictable class names
- Accessible queries for React Testing Library

## Performance

- Optimized animations with CSS transforms
- Lazy loading support
- Minimal re-renders
- GPU-accelerated effects (backdrop-filter)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Graceful degradation for older browsers
- Fallbacks for unsupported features (backdrop-filter, prefers-reduced-motion)
