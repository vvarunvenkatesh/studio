
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
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 relative">

        {/* Left side: Conditional Profile Icon or Login Button */}
        {/* Adjusted margin for desktop */}
        <div className="flex items-center md:ml-2">
          {isLoggedIn ? (
             <Link href="/profile" passHref>
                 {/* If Button needs `asChild` here, ensure only one child */}
                 <Button variant="ghost" size="icon" className="h-9 w-9">
                    <User className="h-5 w-5"/> {/* Single child icon */}
                    {/* Screen reader text doesn't count as a renderable child for Slot */}
                    <span className="sr-only">Profile</span>
                 </Button>
            </Link>
          ) : (
            // Apply accent hover effect directly
            <Button asChild variant="ghost" size="sm" className="hover:bg-accent hover:text-accent-foreground gap-2">
               <Link href="/login">
                   <LogIn className="h-4 w-4" />
                   <span className="hidden sm:inline">Login</span>
               </Link>
            </Button>
          )}
        </div>


        {/* Centered Title and Slogan */}
         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
             <Link href="/" className="text-card-foreground whitespace-nowrap flex items-baseline justify-center">
                 {/* Reverted Brand Name styling */}
                 <span className="text-3xl font-bold">
                    LastMiniT
                 </span>
             </Link>
             {/* Slogan */}
             {/* Changed text color to text-foreground and added opacity */}
             <span className="text-xs text-foreground mt-[-4px] opacity-80">
               Ticket Reselling Platform
             </span>
         </div>


        {/* Right side: Post Ticket Button */}
        {/* Adjusted margin for desktop. Applied gradient background and black text. */}
        <nav className="flex items-center md:mr-2">
           {/* Ensured Link is the direct child when using asChild */}
          <Button asChild variant="default" size="sm" className="bg-gradient-to-r from-[#FF006A] via-[#FFA800] to-[#FFD500] text-black hover:opacity-90 gap-2">
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
