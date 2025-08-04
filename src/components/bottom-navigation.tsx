
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Ticket, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile'; // Ensure this hook exists

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
}

function NavItem({ href, icon: Icon, label }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href === '/profile' && pathname.startsWith('/profile')); // Make profile active for sub-routes

  return (
    <Link href={href} className="flex flex-col items-center justify-center flex-1 group" passHref>
      <div className={cn(
        "flex flex-col items-center justify-center p-2 rounded-md transition-colors w-full",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}>
        <Icon className="h-6 w-6 mb-1" />
        {/* Optional: Add text label below icon if needed */}
        {/* <span className={cn("text-xs", isActive ? "font-medium" : "")}>{label}</span> */}
        <span className="sr-only">{label}</span> {/* Keep for accessibility */}
      </div>
    </Link>
  );
}

export function BottomNavigation() {
  const isMobile = useIsMobile();

  // Only render the bottom navigation on mobile screens
  if (!isMobile) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        <NavItem href="/" icon={Home} label="Home" />
        {/* <NavItem href="/search" icon={Search} label="Search" />  Optional Search */}
        {/* Removed Browse Tickets NavItem */}
        <NavItem href="/post-ticket" icon={Ticket} label="Post Ticket" />
        <NavItem href="/profile" icon={User} label="Profile" /> {/* Added Profile NavItem */}
      </div>
    </nav>
  );
}
