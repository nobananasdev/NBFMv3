# Error Boundary Implementation Guide

## Overview

Error Boundaries have been implemented throughout the application to catch and handle React component errors gracefully, preventing the entire app from crashing when a component fails.

## Components

### 1. ErrorBoundary (`src/components/ErrorBoundary.tsx`)

Main error boundary component that catches errors in child components.

**Features:**
- Catches component errors during rendering, lifecycle methods, and constructors
- Logs errors to console in development
- Sends errors to tracking service in production (ready for Sentry integration)
- Provides default fallback UI
- Supports custom fallback components
- Includes "Try Again" and "Go Home" recovery options

**Usage:**
```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>

// With error callback
<ErrorBoundary onError={(error, errorInfo) => {
  // Custom error handling
}}>
  <YourComponent />
</ErrorBoundary>
```

### 2. ErrorFallback Components (`src/components/ErrorFallback.tsx`)

Reusable error UI components for different contexts.

#### ErrorFallback (Default)
Full-page error display with detailed information.

```tsx
import ErrorFallback from '@/components/ErrorFallback';

<ErrorFallback
  error={error}
  resetError={() => window.location.reload()}
  title="Custom Error Title"
  message="Custom error message"
  showDetails={true}
/>
```

#### CompactErrorFallback
Smaller error display for sections and components.

```tsx
import { CompactErrorFallback } from '@/components/ErrorFallback';

<ErrorBoundary fallback={<CompactErrorFallback />}>
  <SectionComponent />
</ErrorBoundary>
```

#### InlineErrorFallback
Minimal error display for list items and small components.

```tsx
import { InlineErrorFallback } from '@/components/ErrorFallback';

<ErrorBoundary fallback={<InlineErrorFallback />}>
  <ListItem />
</ErrorBoundary>
```

## Implementation Locations

### 1. Root Level (`src/app/layout.tsx`)
Wraps the entire application to catch any unhandled errors.

```tsx
<ErrorBoundary>
  <AuthProvider>
    <NavigationProvider>
      <MainLayout>
        {children}
      </MainLayout>
    </NavigationProvider>
  </AuthProvider>
</ErrorBoundary>
```

### 2. Section Level (`src/components/layout/MainLayout.tsx`)
Each major section is wrapped with its own error boundary:
- Discover Section
- Watchlist Section
- New Seasons Section
- Rated Section

This ensures that if one section crashes, others remain functional.

## Error Tracking Integration

### Current Setup
- Development: Errors logged to console with full stack traces
- Production: Prepared for error tracking service integration

### Adding Sentry (Recommended)

1. Install Sentry:
```bash
npm install @sentry/nextjs
```

2. Update `ErrorBoundary.tsx`:
```typescript
import * as Sentry from '@sentry/nextjs';

logErrorToService(error: Error, errorInfo: ErrorInfo) {
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
  });
}
```

3. Initialize Sentry in your app (follow Sentry's Next.js guide)

### Alternative Services
- **LogRocket**: Session replay with error tracking
- **Bugsnag**: Error monitoring and reporting
- **Rollbar**: Real-time error tracking

## Testing Error Boundaries

### Test Components Available

Located in `src/components/__tests__/ErrorBoundaryTest.tsx`:

1. **ErrorBoundaryTest**: Interactive test button
2. **CrashingComponent**: Always throws error on render
3. **DelayedCrashComponent**: Crashes after 2 seconds
4. **ClickToCrashComponent**: Crashes after 3 clicks

### Manual Testing

1. **Test Root Error Boundary:**
```tsx
// Temporarily add to any page
import { ErrorBoundaryTest } from '@/components/__tests__/ErrorBoundaryTest';

export default function Page() {
  return (
    <>
      <YourContent />
      <ErrorBoundaryTest />
    </>
  );
}
```

2. **Test Section Error Boundary:**
Add a crashing component to any section temporarily.

3. **Test in Browser:**
- Click "Trigger Error" button
- Verify error UI appears
- Check console for error logs
- Test "Try Again" button
- Test "Go Home" button

### Automated Testing (Future)

Consider adding Jest/React Testing Library tests:

```typescript
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '@/components/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('catches errors and displays fallback', () => {
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

## Best Practices

### 1. Granular Error Boundaries
✅ **DO:** Wrap individual sections/features
```tsx
<ErrorBoundary fallback={<CompactErrorFallback />}>
  <FeatureSection />
</ErrorBoundary>
```

❌ **DON'T:** Only have one root-level boundary
```tsx
// This means one error crashes everything
<ErrorBoundary>
  <EntireApp />
</ErrorBoundary>
```

### 2. Appropriate Fallback UI
- **Root level**: Full-page error with navigation options
- **Section level**: Compact error with retry option
- **Component level**: Inline error, minimal disruption

### 3. Error Logging
- Always log errors in development
- Send to tracking service in production
- Include relevant context (user ID, route, etc.)

### 4. Recovery Options
- Provide "Try Again" for transient errors
- Provide "Go Home" for navigation
- Consider automatic retry for network errors

### 5. User Communication
- Clear, non-technical error messages
- Reassure users their data is safe
- Provide actionable next steps

## Common Patterns

### Async Data Loading
```tsx
function DataComponent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(setError); // Handle async errors
  }, []);

  if (error) throw error; // Let ErrorBoundary catch it

  return <div>{data}</div>;
}
```

### Form Submissions
```tsx
function FormComponent() {
  const handleSubmit = async (e) => {
    try {
      await submitForm(data);
    } catch (error) {
      // Either handle locally or throw to ErrorBoundary
      throw error;
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Limitations

Error Boundaries **DO NOT** catch:
- Event handlers (use try-catch)
- Asynchronous code (use try-catch or .catch())
- Server-side rendering errors
- Errors in the error boundary itself

For these cases, use traditional error handling:
```tsx
const handleClick = async () => {
  try {
    await riskyOperation();
  } catch (error) {
    console.error('Error:', error);
    // Show error UI
  }
};
```

## Monitoring & Maintenance

### Regular Checks
1. Review error logs weekly
2. Identify recurring errors
3. Fix root causes, not just symptoms
4. Update error messages based on user feedback

### Metrics to Track
- Error frequency by component
- Error recovery success rate
- User actions after errors
- Most common error types

## Future Enhancements

1. **Error Analytics Dashboard**
   - Track error patterns
   - Identify problematic components
   - Monitor error trends

2. **Smart Recovery**
   - Automatic retry with exponential backoff
   - Cache previous successful state
   - Graceful degradation

3. **User Feedback**
   - Allow users to report errors
   - Collect additional context
   - Send feedback to development team

4. **A/B Testing**
   - Test different error messages
   - Optimize recovery flows
   - Improve user experience

## Resources

- [React Error Boundaries Documentation](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Sentry React Integration](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Error Handling Best Practices](https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react)

## Support

For questions or issues with error boundaries:
1. Check this documentation
2. Review error logs in development
3. Test with provided test components
4. Consult React documentation for edge cases