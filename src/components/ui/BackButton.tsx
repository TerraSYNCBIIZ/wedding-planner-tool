'use client';

export function BackButton() {
  return (
    <button
      type="button"
      className="text-sm text-muted-foreground hover:text-foreground"
      onClick={() => window.history.back()}
    >
      Back
    </button>
  );
} 