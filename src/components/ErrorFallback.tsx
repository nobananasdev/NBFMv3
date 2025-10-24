'use client';

import React from 'react';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
  showDetails?: boolean;
}

/**
 * Reusable error fallback UI component
 * Can be used as a custom fallback for ErrorBoundary
 */
export default function ErrorFallback({
  error,
  resetError,
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  showDetails = process.env.NODE_ENV === 'development',
}: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-background-secondary rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-accent-error/10 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-accent-error"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
        </div>

        <p className="text-text-secondary mb-4">{message}</p>

        {showDetails && error && (
          <details className="mb-4 p-3 bg-background-primary rounded border border-border-primary">
            <summary className="cursor-pointer text-sm font-medium text-text-secondary mb-2">
              Error Details
            </summary>
            <div className="text-xs text-text-tertiary">
              <pre className="overflow-auto whitespace-pre-wrap break-words">
                {error.toString()}
              </pre>
            </div>
          </details>
        )}

        <div className="flex gap-3">
          {resetError && (
            <button
              onClick={resetError}
              className="flex-1 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 px-4 py-2 bg-background-primary text-text-primary rounded-lg hover:bg-background-tertiary transition-colors border border-border-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact error fallback for smaller components
 */
export function CompactErrorFallback({
  error,
  resetError,
}: ErrorFallbackProps) {
  return (
    <div className="p-4 bg-background-secondary rounded-lg border border-accent-error/20">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-accent-error flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary mb-1">
            Failed to load content
          </p>
          <p className="text-xs text-text-secondary mb-2">
            Something went wrong while loading this section.
          </p>
          {resetError && (
            <button
              onClick={resetError}
              className="text-xs text-accent-primary hover:text-accent-primary/80 font-medium"
            >
              Try again
            </button>
          )}
        </div>
      </div>
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mt-3 pt-3 border-t border-border-primary">
          <summary className="cursor-pointer text-xs text-text-tertiary">
            Error details
          </summary>
          <pre className="mt-2 text-xs text-text-tertiary overflow-auto">
            {error.toString()}
          </pre>
        </details>
      )}
    </div>
  );
}

/**
 * Inline error fallback for list items
 */
export function InlineErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-accent-error/5 rounded border border-accent-error/20">
      <svg
        className="w-4 h-4 text-accent-error flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-sm text-text-secondary flex-1">
        Failed to load item
      </span>
      {resetError && (
        <button
          onClick={resetError}
          className="text-xs text-accent-primary hover:text-accent-primary/80 font-medium"
        >
          Retry
        </button>
      )}
    </div>
  );
}