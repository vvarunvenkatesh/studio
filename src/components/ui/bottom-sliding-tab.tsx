
'use client';

import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ChevronUp, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface BottomSlidingTabProps {
  children?: React.ReactNode;
  triggerLabel?: string;
  title?: string;
  description?: string;
}

export function BottomSlidingTab({
  children,
  triggerLabel = "More Options",
  title = "Options",
  description,
}: BottomSlidingTabProps) {
  const isMobile = useIsMobile();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div
          className={cn(
            "fixed left-1/2 -translate-x-1/2 z-40 w-full max-w-[200px] md:max-w-[240px]", // Adjusted width
            isMobile ? "bottom-16" : "bottom-2" // Position above nav bar on mobile, near bottom on desktop
          )}
        >
          <div className="flex justify-center pb-1 pt-1">
            <button
              aria-label={triggerLabel}
              className="flex flex-col items-center gap-1 px-4 py-2 bg-card border border-border rounded-t-lg shadow-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="w-8 h-1 bg-muted-foreground rounded-full group-hover:bg-foreground transition-colors"></div>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{triggerLabel}</span>
            </button>
          </div>
        </div>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[60vh] max-h-[500px] rounded-t-xl p-0" // Removed padding for custom layout
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent auto-focus on close button
      >
        <SheetHeader className="p-4 pb-2 text-left border-b">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="overflow-y-auto h-[calc(100%-5rem)] p-4"> {/* Adjust height for header and padding */}
          {children || (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Filter className="h-12 w-12 mb-4" />
              <p>More options and filters will appear here.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
