
'use client';

import * as React from 'react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {User, MapPin, Menu, LogIn, LogOut } from 'lucide-react'; // Added LogIn, LogOut
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
import {Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle} from '@/components/ui/sheet'; // Changed DialogTitle to SheetTitle
import { Label } from '@/components/ui/label';
import { TermsAndConditionsDialog } from './terms-and-conditions-dialog';

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
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Online',
];

export function Header({className}: HeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [profileImageUrl, setProfileImageUrl] = React.useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = React.useState<string>('');
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showTnCDialog, setShowTnCDialog] = React.useState(false);
  const [tncAccepted, setTncAccepted] = React.useState(true); // Default to true to avoid initial popup if not logged in

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
      const storedImageUrl = localStorage.getItem('profileImageUrl');
      const storedLocation = localStorage.getItem('selectedLocation') || availableLocations[0];
      const accepted = localStorage.getItem('tncAccepted') === 'true';

      setIsLoggedIn(loggedInStatus);
      setTncAccepted(accepted);
      setSelectedLocation(storedLocation);

      if (loggedInStatus && storedImageUrl) {
        setProfileImageUrl(storedImageUrl);
      } else {
        setProfileImageUrl(null);
      }
      
      if (loggedInStatus && !accepted) {
        setShowTnCDialog(true);
      }

      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'isLoggedIn') {
          const newLoginStatus = event.newValue === 'true';
          setIsLoggedIn(newLoginStatus);
          const currentTncAccepted = localStorage.getItem('tncAccepted') === 'true';
          setTncAccepted(currentTncAccepted);

          if (!newLoginStatus) {
            setProfileImageUrl(null);
          } else {
            const updatedImageUrl = localStorage.getItem('profileImageUrl');
            setProfileImageUrl(updatedImageUrl);
            if (!currentTncAccepted) { // Only show T&C if newly logged in and not accepted
                setShowTnCDialog(true);
            }
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
        if (event.key === 'tncAccepted') {
            const newTncStatus = event.newValue === 'true';
            setTncAccepted(newTncStatus);
            if (newTncStatus) { // if T&C accepted, close the dialog
                setShowTnCDialog(false);
            }
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
      // Optionally, dispatch a custom event if other components need to react instantly
      // to location changes without relying on localStorage polling.
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'selectedLocation',
          newValue: newLocation,
          storageArea: localStorage,
        })
      );
    }
  };

  const handleAcceptTnC = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('tncAccepted', 'true');
    }
    setTncAccepted(true);
    setShowTnCDialog(false);
  };

  const handleLogout = () => {
     // Perform logout actions
     if (typeof window !== 'undefined') {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('profileImageUrl');
        localStorage.removeItem('userData'); // Also remove userData if it exists
        // Potentially remove tncAccepted if you want it re-prompted on next login for this user
        // localStorage.removeItem('tncAccepted');
        window.dispatchEvent(new StorageEvent('storage', { key: 'isLoggedIn', newValue: null, storageArea: localStorage }));
        window.dispatchEvent(new StorageEvent('storage', { key: 'profileImageUrl', newValue: null, storageArea: localStorage }));
        window.dispatchEvent(new StorageEvent('storage', { key: 'userData', newValue: null, storageArea: localStorage }));
        // Redirect to home or login page
        window.location.href = '/'; // Or router.push('/') if preferred and router is available
    }
  };

  return (
    <>
    <header className={cn("sticky top-0 z-40 w-full border-b bg-background", className)}>
      <div className="container flex h-16 items-center px-4 md:px-6">
        {isMobile ? (
          <>
            {/* Mobile View */}
            <div className="flex-shrink-0">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="p-2 text-foreground">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full xs:w-3/4 sm:max-w-xs p-0 flex flex-col">
                 <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <div className="p-4 border-b">
                      <Link href="/" className="flex flex-col items-start" onClick={() => setMobileMenuOpen(false)}>
                        <span className="text-xl font-bold text-foreground">
                          <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>ini<span className="text-primary">T</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Ticket Reselling Platform
                        </span>
                      </Link>
                    </div>
                    <nav className="flex-grow p-4 space-y-1">
                      <Button asChild variant="ghost" className="w-full justify-start text-base text-foreground" onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/post-ticket">Post Ticket</Link>
                      </Button>
                      <Button asChild variant="ghost" className="w-full justify-start text-base text-foreground" onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/tickets">Browse Tickets</Link>
                      </Button>
                      {isLoggedIn && (
                        <Button asChild variant="ghost" className="w-full justify-start text-base text-foreground" onClick={() => setMobileMenuOpen(false)}>
                          <Link href="/profile">My Profile</Link>
                        </Button>
                      )}
                       {/* Location Selector in Mobile Menu */}
                       <div className='pt-2'>
                         <Label className="text-sm font-medium text-muted-foreground mb-1 block px-1">Location</Label>
                         <Select value={selectedLocation} onValueChange={(newLocation) => {
                           handleLocationChange(newLocation);
                           setMobileMenuOpen(false); // Close menu on selection
                         }}>
                           <SelectTrigger className="w-full h-9 text-sm border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-transparent focus:ring-offset-0 gap-1">
                             {/* <MapPin className="h-4 w-4 flex-shrink-0 mr-1" /> */}
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
                    </nav>
                    <div className="p-4 border-t mt-auto">
                       {isLoggedIn ? (
                           <Button variant="outline" className="w-full text-base gap-2 text-foreground" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                             <LogOut className="h-4 w-4" /> Logout
                           </Button>
                        ) : (
                          <Button asChild variant="default" className="w-full text-base gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setMobileMenuOpen(false)}>
                             <Link href="/login"><LogIn className="h-4 w-4" /> Login / Signup</Link>
                          </Button>
                        )}
                    </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex-grow flex justify-center overflow-hidden px-2">
              <div className="flex flex-col items-center text-center">
                <Link href="/" className="whitespace-nowrap flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-bold text-foreground"> {/* Ensured consistency with Desktop */}
                     <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>ini<span className="text-primary">T</span>
                  </span>
                </Link>
                <span className="text-[10px] text-foreground opacity-80 truncate max-w-[150px]">
                  Ticket Reselling Platform
                </span>
              </div>
            </div>

            <div className="flex-shrink-0">
              <Select value={selectedLocation} onValueChange={handleLocationChange}>
                <SelectTrigger
                  className="w-auto h-auto p-1.5 border-none bg-transparent focus:ring-0 focus:ring-offset-0 text-foreground hover:bg-accent hover:text-accent-foreground"
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
            {/* Desktop View */}
            <div className="flex items-center flex-shrink-0">
              <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <Link href="/post-ticket">
                  Post Ticket
                </Link>
              </Button>
            </div>

            <div className="flex-grow flex justify-center">
              <div className="flex flex-col items-center">
                <Link
                  href="/"
                  className="whitespace-nowrap flex items-baseline justify-center gap-1"
                >
                  <span className="text-3xl font-bold text-foreground">
                    <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>ini<span className="text-primary">T</span>
                  </span>
                </Link>
                <span className="text-xs text-foreground mt-[-4px] opacity-80">
                  Ticket Reselling Platform
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
               {isLoggedIn ? (
                <Link href="/profile" className="mr-1 md:mr-0">
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
    <TermsAndConditionsDialog
        open={showTnCDialog}
        onOpenChange={setShowTnCDialog}
        onAccept={handleAcceptTnC}
    />
    </>
  );
}
