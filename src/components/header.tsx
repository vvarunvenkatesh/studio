
'use client'; // Make this a client component to use hooks

import * as React from 'react'; // Import React
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, User } from 'lucide-react'; // Added User icon

export function Header() {
  // Placeholder for authentication status - using localStorage for simulation
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  // Read login status from localStorage on client-side after mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(loggedInStatus);
    }
  }, []);


  return (
    // Keep header background white (bg-card)
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 relative">

        {/* Left side: Login/Signup or Profile Button */}
        {/* Apply styling similar to the provided image */}
        <div className="flex items-center md:ml-2">
          {isLoggedIn ? (
            // Profile Button - links to profile page
             <Button asChild variant="ghost" size="icon" className="rounded-full border border-input bg-background hover:bg-accent hover:text-accent-foreground">
              <Link href="/profile">
                <User className="h-5 w-5" />
                <span className="sr-only">Profile</span>
              </Link>
            </Button>
          ) : (
            // Login/Signup Button
             <Button asChild variant="outline" size="sm" className="bg-background hover:bg-accent hover:text-accent-foreground gap-2 text-foreground border">
               <Link href="/login">
                   <span className="">Login/Signup</span>
               </Link>
           </Button>
          )}
        </div>


        {/* Centered Title and Slogan */}
         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
             <Link href="/" className="text-card-foreground whitespace-nowrap flex items-baseline justify-center gap-1">
                 <span className="text-3xl font-bold">
                    <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>ini<span className="text-destructive">T</span>
                 </span>
             </Link>
             {/* Slogan */}
             <span className="text-xs text-foreground mt-[-4px] opacity-80">
               Ticket Reselling Platform
             </span>
         </div>


        {/* Right side: Post Ticket Button */}
        <nav className="flex items-center md:mr-2">
           {/* Use gradient background, ensure text is visible */}
          <Button asChild size="sm" className="gap-2 text-white bg-gradient-to-r from-[#FF006A] via-[#FFA800] to-[#FFD500] hover:opacity-90">
            <Link href="/post-ticket">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Post Ticket</span>
              <span className="sm:hidden">Post</span> {/* Shorter text for mobile */}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
