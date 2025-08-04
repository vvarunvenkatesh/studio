
'use client';

import * as React from 'react';

export function Preloader() {
  const [isFadingOut, setIsFadingOut] = React.useState(false);

  React.useEffect(() => {
    // This timeout should be slightly less than the one in layout.tsx
    // to ensure the fade-out animation completes before the component is unmounted.
    const timer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1800); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        isFadingOut ? 'animate-preloader-fade-out' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center">
        <span className="text-5xl font-bold text-foreground">
          <span className="text-destructive">L</span>ast
          <span className="text-destructive">M</span>inI
          <span className="text-primary">T</span>
        </span>
        <span className="text-sm text-foreground mt-[-4px] opacity-80">
          Ticket Reselling Platform
        </span>
      </div>
      <div className="absolute bottom-10">
        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse" style={{ animationDuration: '1.5s' }}></div>
        </div>
      </div>
    </div>
  );
}
