// This file helps Next.js generate static params for dynamic routes
// It's used during the build process for Netlify

export async function generateStaticParams() {
  // Return a small set of placeholder IDs to satisfy the build process
  // The actual data will be fetched dynamically by the client component
  return [
    { id: 'placeholder-1' },
    { id: 'placeholder-2' },
    { id: 'placeholder-3' }
  ];
} 