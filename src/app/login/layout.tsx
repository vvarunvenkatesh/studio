
'use client';

import * as React from 'react';

// This component is a simple pass-through for its children.
// It's created to add a Suspense boundary around the login page.
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The useSearchParams() hook, used in the login page, requires a Suspense boundary.
    // This wrapper provides that boundary to prevent build-time rendering errors.
    <React.Suspense>
      {children}
    </React.Suspense>
  );
}
