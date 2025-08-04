
'use client';

import * as React from 'react';

// This component is a simple pass-through for its children.
// It's created to add a Suspense boundary around the tickets page.
export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The useSearchParams() hook, used within the page, requires a Suspense boundary.
    // This wrapper provides that boundary to prevent build-time rendering errors.
    <React.Suspense>
      {children}
    </React.Suspense>
  );
}
