
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, LogIn, User } from 'lucide-react'; // Added LogIn and User icons
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Header() {
  // Placeholder for authentication status
  const isLoggedIn = false; // Set to true to show profile icon

  return (
    // Keep header background white (bg-card)
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 relative"> {/* Added relative positioning */}

        {/* Left side: Conditional Profile Icon or Login Button */}
        {/* Adjusted margin for desktop */}
        <div className="flex items-center md:ml-2">
          {isLoggedIn ? (
             <Link href="/profile" passHref>
                {/* <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarImage src="https://picsum.photos/100?a" alt="User Profile" data-ai-hint="profile avatar user" />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar> */}
                 <Button variant="ghost" size="icon" className="h-9 w-9">
                    <User className="h-5 w-5"/> {/* Use User icon */}
                    <span className="sr-only">Profile</span>
                 </Button>
            </Link>
          ) : (
            <Button asChild variant="ghost" size="sm">
               <Link href="/login" className="gap-2">
                   <LogIn className="h-4 w-4" />
                   <span className="hidden sm:inline">Login</span>
               </Link>
            </Button>
          )}
        </div>


        {/* Centered Title - Adjusted font sizes and alignment */}
         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
             <Link href="/" className="text-card-foreground whitespace-nowrap flex items-baseline gap-1">
                  {/* Updated Brand Name with colored letters */}
                 <span className="text-3xl font-bold">
                    <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>ini<span className="text-destructive">T</span>
                 </span>
                 {/* Removed Tagline */}
             </Link>
         </div>


        {/* Right side: Post Ticket Button */}
        {/* Adjusted margin for desktop */}
        <nav className="flex items-center md:mr-2">
          <Button asChild variant="default" size="sm">
            <Link href="/post-ticket" className="gap-2">
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
