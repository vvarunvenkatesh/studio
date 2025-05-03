
'use client'; // Needed for useState and useEffect

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, User } from 'lucide-react'; // User icon for fallback
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components

export function Header() {
  // State to track login status
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  // Check localStorage on component mount (client-side only)
  React.useEffect(() => {
    // Check if running in the browser before accessing localStorage
    if (typeof window !== 'undefined') {
      const loggedInStatus = localStorage.getItem('isLoggedIn');
      setIsLoggedIn(loggedInStatus === 'true');
    }
  }, []);

  // Function to handle logout (example)
  const handleLogout = () => {
     if (typeof window !== 'undefined') {
        localStorage.removeItem('isLoggedIn');
        setIsLoggedIn(false);
        // Optionally redirect to home or login page
         window.location.href = '/'; // Force reload to update header state reliably
     }
  };


  return (
    // Keep header background white (bg-card)
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 relative">

        {/* Left side: Login/Signup or Profile Button */}
        {/* Increased margin for desktop */}
        <div className="flex items-center md:ml-4">
           {isLoggedIn ? (
               <div className="flex items-center gap-3"> {/* Added gap for spacing */}
                 {/* Avatar instead of icon */}
                 <Link href="/profile">
                   <Avatar className="h-8 w-8 cursor-pointer">
                     {/* Placeholder image - replace with actual user image URL */}
                     <AvatarImage src="https://picsum.photos/40/40?random=profile" alt="User profile picture" data-ai-hint="user avatar" />
                     {/* Fallback with initials or generic icon */}
                     <AvatarFallback>
                       <User className="h-4 w-4 text-muted-foreground" />
                     </AvatarFallback>
                   </Avatar>
                 </Link>
                  {/* Logout Button */}
                  <Button onClick={handleLogout} variant="outline" size="sm">Logout</Button>
               </div>
            ) : (
                 // Login/Signup Button with Outline style and gradient hover
                <Button asChild variant="outline" size="sm" className="bg-background hover:bg-gradient-to-r from-[#FF006A] via-[#FFA800] to-[#FFD500] hover:text-primary-foreground gap-2 text-foreground border">
                    <Link href="/login">
                        <span>Login/Signup</span>
                    </Link>
                </Button>
            )}
        </div>


        {/* Centered Title and Slogan */}
         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
             <Link href="/" className="text-card-foreground whitespace-nowrap flex items-baseline justify-center gap-1">
                 {/* Consistent LastMiniT styling */}
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
        {/* Increased margin for desktop */}
        <nav className="flex items-center md:mr-4">
           {/* Post Ticket button with gradient background */}
          <Button asChild size="sm" className="gap-2 text-white bg-gradient-to-r from-[#FF006A] via-[#FFA800] to-[#FFD500] hover:opacity-90 transition-opacity">
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
