
'use client'; // Needed for useState and useEffect

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { User, MapPin } from 'lucide-react'; // User icon for fallback, MapPin for location
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select
import { cn } from '@/lib/utils'; // Import cn utility

interface HeaderProps {
  className?: string; // Add className prop
}

// Hardcoded locations for now
const availableLocations = ['New York', 'Boston', 'Chicago', 'Los Angeles', 'Online'];

export function Header({ className }: HeaderProps) { // Destructure className
  // State to track login status
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  // State to store user profile image URL
  const [profileImageUrl, setProfileImageUrl] = React.useState<string | null>(null);
  // State for selected location
  const [selectedLocation, setSelectedLocation] = React.useState<string>('');


  // Check localStorage on component mount (client-side only)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedInStatus = localStorage.getItem('isLoggedIn');
      const storedImageUrl = localStorage.getItem('profileImageUrl');
      const storedLocation = localStorage.getItem('selectedLocation') || availableLocations[0]; // Default to first location if none stored

      setIsLoggedIn(loggedInStatus === 'true');
      setSelectedLocation(storedLocation); // Set initial location

      if (loggedInStatus === 'true' && storedImageUrl) {
        setProfileImageUrl(storedImageUrl);
      } else {
        // Reset if not logged in or no image stored
        setProfileImageUrl(null);
      }

      // Add event listener for storage changes
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'isLoggedIn') {
          const newLoginStatus = event.newValue === 'true';
          setIsLoggedIn(newLoginStatus);
           if (!newLoginStatus) {
             setProfileImageUrl(null); // Clear image if logged out
           } else {
              // Fetch image if newly logged in
              const updatedImageUrl = localStorage.getItem('profileImageUrl');
              setProfileImageUrl(updatedImageUrl);
           }
        }
         if (event.key === 'profileImageUrl') {
            // Update image only if user is logged in
            if (localStorage.getItem('isLoggedIn') === 'true') {
               setProfileImageUrl(event.newValue);
            } else {
                setProfileImageUrl(null); // Clear if somehow updated while logged out
            }
         }
         if (event.key === 'selectedLocation') {
             setSelectedLocation(event.newValue || availableLocations[0]);
         }
      };

      window.addEventListener('storage', handleStorageChange);

      // Cleanup listener on component unmount
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, []); // Run only once on mount

  // Handle location change
  const handleLocationChange = (newLocation: string) => {
    setSelectedLocation(newLocation);
    if (typeof window !== 'undefined') {
       localStorage.setItem('selectedLocation', newLocation);
        // Optional: Dispatch storage event if needed for other components
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'selectedLocation',
            newValue: newLocation,
            storageArea: localStorage,
         }));
    }
    // You might want to trigger a data refetch based on the new location here
  }


  return (
    // Apply className prop here, changed background to bg-background
    <header className={cn("sticky top-0 z-40 w-full border-b bg-background", className)}>
       {/* Increased container padding for more space */}
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 relative">

        {/* Left side: Brand Title */}
         <div className="flex flex-col items-center">
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


        {/* Right side: Location, Profile/Login, Post Ticket */}
         {/* Adjusted ml for desktop, added gap */}
         <div className="flex items-center gap-3 md:gap-4 md:mr-4"> {/* Use gap-3 on mobile, gap-4 on md */}
           {/* Location Selector */}
            <Select value={selectedLocation} onValueChange={handleLocationChange}>
                <SelectTrigger className="w-auto h-9 px-3 py-1 text-sm border-foreground bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-transparent focus:ring-offset-0 gap-1">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                    {availableLocations.map(location => (
                        <SelectItem key={location} value={location}>
                            {location}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

           {/* Profile or Login/Signup */}
           {isLoggedIn ? (
               <Link href="/profile" className="ml-1 md:ml-1"> {/* Adjusted margin left */}
                 <Avatar className="h-8 w-8 cursor-pointer">
                   <AvatarImage src={profileImageUrl || undefined} alt="User profile picture" data-ai-hint="user avatar" />
                   <AvatarFallback>
                     <User className="h-4 w-4 text-muted-foreground" />
                   </AvatarFallback>
                 </Avatar>
               </Link>
            ) : (
                 // Login/Signup Button: White background, black border, black text, red hover
                 <Button
                     asChild
                     variant="outline"
                     size="sm"
                      className="border-foreground bg-background text-foreground hover:bg-accent hover:text-accent-foreground" // Use accent colors for hover
                 >
                   <Link href="/login">
                       {/* Wrap text in a span */}
                       <span>Login/Signup</span>
                   </Link>
                 </Button>
            )}

            {/* Post Ticket button with specified color #FF2459 */}
            <Button asChild size="sm" className="ml-2 text-white bg-[#FF2459] hover:bg-[#FF2459]/90 transition-colors">
            <Link href="/post-ticket">
              {/* Wrap multiple children in a single span */}
              <span>
                 <span className="hidden sm:inline">Post Ticket</span>
                 <span className="sm:hidden">Post</span> {/* Shorter text for mobile */}
              </span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

