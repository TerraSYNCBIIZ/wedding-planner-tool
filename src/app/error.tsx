'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error occurred:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
      <p className="mb-6 text-lg">
        Sorry, an unexpected error has occurred.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="btn btn-primary"
          type="button"
        >
          Try again
        </button>
        <a href="/" className="btn btn-secondary">
          Go Home
        </a>
      </div>
    </div>
  );
} 