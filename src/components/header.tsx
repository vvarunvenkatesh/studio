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
import {Sheet, SheetContent, SheetTrigger} from '@/components/ui/sheet';
import {Label} from '@/components/ui/label';

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
        localStorage.getItem('selectedLocation') || availableLocations[0]; // Default to first location if none stored

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
            setProfileImageUrl(null);
          } else {
            const updatedImageUrl = localStorage.getItem('profileImageUrl');
            setProfileImageUrl(updatedImageUrl);
          }
        }
        if (event.key === 'profileImageUrl') {
          if (localStorage.getItem('isLoggedIn') === 'true') {
            setProfileImageUrl(event.newValue);
          } else {
            setProfileImageUrl(null);
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
    <header
      className={cn('sticky top-0 z-40 w-full border-b bg-background', className)}
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {isMobile ? (
          <>
            {/* Mobile View */}
            <div className="flex items-center justify-between w-full">
              {/* Hamburger Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="p-2">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:w-64">
                  <div className="py-4 flex flex-col h-full">
                    <div className="flex-grow space-y-2">
                      <Button asChild variant="ghost" className="w-full justify-start">
                        <Link href="/post-ticket" onClick={() => setMobileMenuOpen(false)}>Post Ticket</Link>
                      </Button>
                      <Button asChild variant="ghost" className="w-full justify-start">
                        <Link href="/tickets" onClick={() => setMobileMenuOpen(false)}>Browse Tickets</Link>
                      </Button>
                      {/* Location Selector in Mobile Menu */}
                       <div className='p-2'>
                         <Label className="text-sm font-medium text-muted-foreground mb-1">Location</Label>
                         <Select value={selectedLocation} onValueChange={(newLocation) => {
                           handleLocationChange(newLocation);
                           setMobileMenuOpen(false); // Close menu on selection
                         }}>
                           <SelectTrigger className="w-full h-9 px-3 py-1 text-sm border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-transparent focus:ring-offset-0 gap-1">
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
                       </div>
                    </div>
                     {/* Login/Logout/Profile at the bottom */}
                      <div className="mt-auto">
                          {isLoggedIn ? (
                              <Button asChild variant="ghost" className="w-full justify-start">
                                <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>My Profile</Link>
                              </Button>
                          ) : (
                              <Button asChild variant="ghost" className="w-full justify-start">
                                 <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Login/Signup</Link>
                              </Button>
                          )}
                     </div>
                 </div>
                </SheetContent>
              </Sheet>

              {/* Brand Title */}
              <div className="flex flex-col items-center">
                <Link
                  href="/"
                  className="whitespace-nowrap flex items-baseline justify-center gap-1"
                >
                  <span className="text-3xl font-bold text-foreground">
                    <span className="text-destructive">L</span>ast
                    <span className="text-destructive">M</span>ini
                    <span className="text-destructive">T</span>
                  </span>
                </Link>
                <span className="text-xs text-foreground mt-[-4px] opacity-80">
                  Ticket Reselling Platform
                </span>
              </div>

              {/* Profile or Login/Signup */}
              <div className="flex items-center">
                {isLoggedIn ? (
                  <Link href="/profile" className="ml-1 md:ml-2">
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarImage
                        src={profileImageUrl || undefined}
                        alt="User profile picture"
                        data-ai-hint="user avatar"
                      />
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
                    <Link href="/login">Login/Signup</Link>
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Desktop View */}
            <div className="flex items-center">
              <Button
                asChild
                size="sm"
                className="text-white bg-[#FF2459] hover:bg-[#FF2459]/90 transition-colors"
              >
                <Link href="/post-ticket">Post Ticket</Link>
              </Button>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <Link
                href="/"
                className="whitespace-nowrap flex items-baseline justify-center gap-1"
              >
                <span className="text-3xl font-bold text-foreground">
                  <span className="text-destructive">L</span>ast
                  <span className="text-destructive">M</span>ini
                  <span className="text-destructive">T</span>
                </span>
              </Link>
              <span className="text-xs text-foreground mt-[-4px] opacity-80">
                Ticket Reselling Platform
              </span>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              <Select value={selectedLocation} onValueChange={handleLocationChange}>
                <SelectTrigger
                  className="w-auto h-9 px-3 py-1 text-sm border-foreground bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-transparent focus:ring-offset-0 gap-1"
                >
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

              {isLoggedIn ? (
                <Link href="/profile" className="ml-1 md:ml-2">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage
                      src={profileImageUrl || undefined}
                      alt="User profile picture"
                      data-ai-hint="user avatar"
                    />
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
                  <Link href="/login">Login/Signup</Link>
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
