
'use client'; // Needed for useState and useEffect

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, User } from 'lucide-react'; // User icon for fallback
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components
import { cn } from '@/lib/utils'; // Import cn utility

interface HeaderProps {
  className?: string; // Add className prop
}


export function Header({ className }: HeaderProps) { // Destructure className
  // State to track login status
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  // State to store user profile image URL
  const [profileImageUrl, setProfileImageUrl] = React.useState<string | null>(null);


  // Check localStorage on component mount (client-side only)
  // Avoid hydration errors by ensuring this runs only on the client
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedInStatus = localStorage.getItem('isLoggedIn');
      const storedImageUrl = localStorage.getItem('profileImageUrl');
      setIsLoggedIn(loggedInStatus === 'true');
      if (loggedInStatus === 'true' && storedImageUrl) {
        setProfileImageUrl(storedImageUrl);
      } else {
        // Reset if not logged in or no image stored
        setProfileImageUrl(null);
      }

      // Add event listener for storage changes (optional, for cross-tab updates)
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'isLoggedIn') {
          const newLoginStatus = event.newValue === 'true';
          setIsLoggedIn(newLoginStatus);
           // Reset image if logging out
           if (!newLoginStatus) {
             setProfileImageUrl(null);
             // Also clear from storage if desired
             // localStorage.removeItem('profileImageUrl');
           } else {
              // If logging in, try to load image immediately
              const updatedImageUrl = localStorage.getItem('profileImageUrl');
              setProfileImageUrl(updatedImageUrl);
           }
        }
         if (event.key === 'profileImageUrl') {
            // Update image only if currently logged in
            if (localStorage.getItem('isLoggedIn') === 'true') {
               setProfileImageUrl(event.newValue);
            } else {
                setProfileImageUrl(null); // Clear if somehow updated while logged out
            }
         }
      };

      window.addEventListener('storage', handleStorageChange);

      // Cleanup listener on component unmount
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, []); // Run only once on mount


  return (
    // Apply className prop here, changed background to bg-background
    <header className={cn("sticky top-0 z-40 w-full border-b bg-background", className)}>
       {/* Increased container padding for more space */}
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 relative">

        {/* Left side: Login/Signup or Profile Button */}
         {/* Added margin for desktop */}
         <div className="flex items-center md:ml-4">
           {isLoggedIn ? (
               <div className="flex items-center gap-3"> {/* Removed ml-4 */}
                 <Link href="/profile">
                   <Avatar className="h-8 w-8 cursor-pointer ml-4"> {/* Added ml-4 */}
                     {/* Use state for image URL, provide fallback */}
                     <AvatarImage src={profileImageUrl || undefined} alt="User profile picture" data-ai-hint="user avatar" />
                     <AvatarFallback>
                       <User className="h-4 w-4 text-muted-foreground" />
                     </AvatarFallback>
                   </Avatar>
                 </Link>
               </div>
            ) : (
                 // Login/Signup Button: White background, black border, black text, light green hover
                 <Button
                     asChild
                     variant="outline"
                     size="sm"
                     className="border-foreground bg-background text-foreground hover:bg-accent hover:text-accent-foreground gap-2" // Apply requested styles
                 >
                   <Link href="/login">
                     <div>Login/Signup</div>
                   </Link>
                 </Button>
            )}
        </div>


        {/* Centered Title and Slogan */}
         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
             <Link href="/" className="whitespace-nowrap flex items-baseline justify-center gap-1">
                 {/* Consistent LastMiniT styling - Updated text color */}
                 <span className="text-3xl font-bold text-foreground">
                    <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>ini<span className="text-destructive">T</span>
                 </span>
             </Link>
             {/* Slogan */}
             <span className="text-xs text-foreground mt-[-4px] opacity-80">
               Ticket Reselling Platform
             </span>
         </div>


        {/* Right side: Post Ticket Button */}
         {/* Added margin for desktop */}
        <nav className="flex items-center md:mr-0"> {/* Adjusted mr */}
           {/* Post Ticket button with specified color #FF2459 */}
           {/* Added mr-4 to create gap */}
          <Button asChild size="sm" className="gap-2 text-white bg-[#FF2459] hover:bg-[#FF2459]/90 transition-colors mr-4">
            <Link href="/post-ticket">
                <div className="flex items-center gap-2"> {/* Ensure icon and text are together */}
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Post Ticket</span>
                  <span className="sm:hidden">Post</span> {/* Shorter text for mobile */}
                </div>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
