'use client';

import React, { useState } from 'react';

/**
 * Test component to verify ErrorBoundary functionality
 * This component can intentionally throw errors to test error handling
 * 
 * Usage: Import and add to a page temporarily to test error boundaries
 * Remove after testing is complete
 */
export function ErrorBoundaryTest() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Test error: ErrorBoundary is working correctly!');
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background-secondary p-4 rounded-lg shadow-lg border border-border-primary">
      <div className="mb-2">
        <p className="text-sm font-medium text-text-primary mb-1">
          Error Boundary Test
        </p>
        <p className="text-xs text-text-secondary mb-3">
          Click to trigger an error and test the error boundary
        </p>
      </div>
      <button
        onClick={() => setShouldThrow(true)}
        className="w-full px-4 py-2 bg-accent-error text-white rounded hover:bg-accent-error/90 transition-colors text-sm font-medium"
      >
        Trigger Error
      </button>
    </div>
  );
}

/**
 * Component that throws an error during render
 */
export function CrashingComponent() {
  throw new Error('This component always crashes!');
  return <div>This will never render</div>;
}

/**
 * Component that throws an error after a delay
 */
export function DelayedCrashComponent() {
  const [shouldCrash, setShouldCrash] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShouldCrash(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (shouldCrash) {
    throw new Error('Delayed crash after 2 seconds!');
  }

  return (
    <div className="p-4 bg-background-secondary rounded">
      <p className="text-text-primary">This component will crash in 2 seconds...</p>
    </div>
  );
}

/**
 * Component that throws an error on button click
 */
export function ClickToCrashComponent() {
  const [count, setCount] = useState(0);

  if (count > 3) {
    throw new Error('Clicked too many times!');
  }

  return (
    <div className="p-4 bg-background-secondary rounded">
      <p className="text-text-primary mb-2">Click count: {count}</p>
      <p className="text-text-secondary text-sm mb-3">
        Will crash after 3 clicks
      </p>
      <button
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
      >
        Click Me ({3 - count} clicks remaining)
      </button>
    </div>
  );
}