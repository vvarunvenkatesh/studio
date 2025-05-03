
'use client'; // Needed for useState and useEffect

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, User } from 'lucide-react'; // User icon for fallback
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components

export function Header() {
  // State to track login status
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  // State to store user profile image URL (initially placeholder)
  // In a real app, this would come from user data fetched after login
  const [profileImageUrl, setProfileImageUrl] = React.useState('https://picsum.photos/40/40?random=profile');

  // Check localStorage on component mount (client-side only)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedInStatus = localStorage.getItem('isLoggedIn');
      const storedImageUrl = localStorage.getItem('profileImageUrl');
      setIsLoggedIn(loggedInStatus === 'true');
      if (loggedInStatus === 'true' && storedImageUrl) {
        setProfileImageUrl(storedImageUrl);
      } else if (loggedInStatus !== 'true') {
        // Reset to default if not logged in
        setProfileImageUrl('https://picsum.photos/40/40?random=profile');
      }

      // Add event listener for storage changes (optional, for cross-tab updates)
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'isLoggedIn') {
          setIsLoggedIn(event.newValue === 'true');
           // Reset image if logging out
           if (event.newValue !== 'true') {
             setProfileImageUrl('https://picsum.photos/40/40?random=profile');
             localStorage.removeItem('profileImageUrl'); // Clear stored image on logout
           }
        }
         if (event.key === 'profileImageUrl') {
            if (isLoggedIn) { // Only update if logged in
                setProfileImageUrl(event.newValue || 'https://picsum.photos/40/40?random=profile');
            }
         }
      };

      window.addEventListener('storage', handleStorageChange);

      // Cleanup listener on component unmount
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [isLoggedIn]); // Re-run effect if isLoggedIn state changes (e.g., after programmatic logout)


  return (
    // Keep header background white (bg-card)
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 relative">

        {/* Left side: Login/Signup or Profile Button */}
        <div className="flex items-center md:ml-4"> {/* Added margin for desktop */}
           {isLoggedIn ? (
               <div className="flex items-center gap-3"> {/* Added gap for spacing */}
                 {/* Avatar instead of icon */}
                 <Link href="/profile">
                   <Avatar className="h-8 w-8 cursor-pointer">
                     {/* Use state for image URL */}
                     <AvatarImage src={profileImageUrl} alt="User profile picture" data-ai-hint="user avatar" />
                     {/* Fallback with initials or generic icon */}
                     <AvatarFallback>
                       <User className="h-4 w-4 text-muted-foreground" />
                     </AvatarFallback>
                   </Avatar>
                 </Link>
                 {/* Logout Button removed from here */}
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
        <nav className="flex items-center md:mr-4"> {/* Added margin for desktop */}
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
