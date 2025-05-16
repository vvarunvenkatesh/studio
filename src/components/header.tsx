
'use client';

import * as React from 'react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {User, MapPin, Menu} from 'lucide-react';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {cn} from '@/lib/utils';
import {useIsMobile} from '@/hooks/use-mobile';
import {Sheet, SheetContent, SheetTrigger, SheetClose} from '@/components/ui/sheet'; // Added SheetClose
import {Label} from '@/components/ui/label';
import { DialogTitle } from "@/components/ui/dialog";


interface HeaderProps {
  className?: string;
}

const availableLocations = [
  'Hyderabad',
  'Bangalore',
  'Chennai',
  'Mumbai',
  'Delhi',
  'Kolkata',
  'Online',
];

export function Header({className}: HeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [profileImageUrl, setProfileImageUrl] = React.useState<string | null>(
    null
  );
  const [selectedLocation, setSelectedLocation] = React.useState<string>('');
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedInStatus = localStorage.getItem('isLoggedIn');
      const storedImageUrl = localStorage.getItem('profileImageUrl');
      const storedLocation =
        localStorage.getItem('selectedLocation') || availableLocations[0];

      setIsLoggedIn(loggedInStatus === 'true');
      setSelectedLocation(storedLocation);

      if (loggedInStatus === 'true' && storedImageUrl) {
        setProfileImageUrl(storedImageUrl);
      } else {
        setProfileImageUrl(null);
      }

      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'isLoggedIn') {
          const newLoginStatus = event.newValue === 'true';
          setIsLoggedIn(newLoginStatus);
          if (!newLoginStatus) {
            setProfileImageUrl(null); // Clear image if logged out
          } else {
            // If logging in, try to load image again
            const updatedImageUrl = localStorage.getItem('profileImageUrl');
            setProfileImageUrl(updatedImageUrl);
          }
        }
        if (event.key === 'profileImageUrl') {
          if (localStorage.getItem('isLoggedIn') === 'true') {
            setProfileImageUrl(event.newValue);
          } else {
            setProfileImageUrl(null); // Ensure image is cleared if logout happened in another tab
          }
        }
        if (event.key === 'selectedLocation') {
          setSelectedLocation(event.newValue || availableLocations[0]);
        }
      };

      window.addEventListener('storage', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, []);

  const handleLocationChange = (newLocation: string) => {
    setSelectedLocation(newLocation);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLocation', newLocation);
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'selectedLocation',
          newValue: newLocation,
          storageArea: localStorage,
        })
      );
    }
  };

  return (
    <header className={cn("sticky top-0 z-40 w-full border-b bg-background", className)}>
      <div className="container flex h-16 items-center px-4 md:px-6">
        {isMobile ? (
          <>
            {/* Mobile View */}
            {/* Hamburger Menu (Left) */}
            <div className="flex-shrink-0">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="p-2">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full xs:w-3/4 sm:w-64 p-0">
                  <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b">
                      <Link href="/" className="flex flex-col items-start" onClick={() => setMobileMenuOpen(false)}>
                        <span className="text-xl font-bold text-foreground">
                          <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>ini<span className="text-destructive">T</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Ticket Reselling Platform
                        </span>
                      </Link>
                    </div>
                    <nav className="flex-grow p-4 space-y-2">
                      <Button asChild variant="ghost" className="w-full justify-start text-base" onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/post-ticket">Post Ticket</Link>
                      </Button>
                      <Button asChild variant="ghost" className="w-full justify-start text-base" onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/tickets">Browse Tickets</Link>
                      </Button>
                      {isLoggedIn && (
                        <Button asChild variant="ghost" className="w-full justify-start text-base" onClick={() => setMobileMenuOpen(false)}>
                          <Link href="/profile">My Profile</Link>
                        </Button>
                      )}
                    </nav>
                    <div className="p-4 border-t mt-auto">
                       {isLoggedIn ? (
                           <Avatar className="h-10 w-10 mb-2">
                             <AvatarImage src={profileImageUrl || undefined} alt="User profile picture" data-ai-hint="user avatar"/>
                             <AvatarFallback><User className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                           </Avatar>
                        ) : (
                          <Button asChild variant="default" className="w-full text-base" onClick={() => setMobileMenuOpen(false)}>
                             <Link href="/login">Login / Signup</Link>
                          </Button>
                        )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Brand Title (Center) - Takes available space */}
            <div className="flex-grow flex justify-center overflow-hidden px-2">
              <div className="flex flex-col items-center text-center">
                <Link href="/" className="whitespace-nowrap flex items-baseline justify-center gap-1" onClick={(e) => e.preventDefault()}>
                  <span className="text-2xl font-bold text-foreground">
                    <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>ini<span className="text-destructive">T</span>
                  </span>
                </Link>
                <span className="text-[10px] text-foreground opacity-80 truncate max-w-[150px]">
                  Ticket Reselling Platform
                </span>
              </div>
            </div>

            {/* Mobile Location Icon Dropdown (Right) */}
            <div className="flex-shrink-0">
              <Select value={selectedLocation} onValueChange={handleLocationChange}>
                <SelectTrigger
                  className="w-auto h-auto p-1.5 border-none bg-transparent focus:ring-0 focus:ring-offset-0 text-foreground hover:bg-accent hover:text-accent-foreground [&>svg:last-child]:hidden"
                  aria-label="Select Location"
                >
                  <MapPin className="h-5 w-5 flex-shrink-0" />
                </SelectTrigger>
                <SelectContent>
                  {availableLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            {/* Desktop View - Refactored for better centering and right-alignment */}
            {/* Left Section (Post Ticket) */}
            <div className="flex items-center flex-shrink-0">
              <Button asChild size="sm" className="text-white bg-[#FF2459] hover:bg-[#FF2459]/90 transition-colors">
                <Link href="/post-ticket">
                  Post Ticket
                </Link>
              </Button>
            </div>

            {/* Center Section (Title) */}
            <div className="flex-grow flex justify-center">
              <div className="flex flex-col items-center">
                <Link
                  href="/"
                  className="whitespace-nowrap flex items-baseline justify-center gap-1"
                >
                  <span className="text-3xl font-bold text-foreground">
                    <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>ini<span className="text-destructive">T</span>
                  </span>
                </Link>
                <span className="text-xs text-foreground mt-[-4px] opacity-80">
                  Ticket Reselling Platform
                </span>
              </div>
            </div>

            {/* Right Section (Profile/Login, THEN Location Dropdown) */}
            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
              {isLoggedIn ? (
                <Link href="/profile" className="ml-1 md:ml-2">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={profileImageUrl || undefined} alt="User profile picture" data-ai-hint="user avatar" />
                    <AvatarFallback>
                      <User className="h-4 w-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-foreground bg-background text-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent"
                >
                  <Link href="/login">
                    Login/Signup
                  </Link>
                </Button>
              )}
               <Select value={selectedLocation} onValueChange={handleLocationChange}>
                <SelectTrigger className="w-auto h-9 px-3 py-1 text-sm border-foreground bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-transparent focus:ring-offset-0 gap-1">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {availableLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
