
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, LogIn } from 'lucide-react'; // Added LogIn icon
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Header() {
  // Placeholder for authentication status
  const isLoggedIn = false; // Set to true to show profile icon

  return (
    // Keep header background white (bg-card)
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">

        {/* Left side: Conditional Profile Icon or Login Button */}
        <div className="flex items-center">
          {isLoggedIn ? (
             <Link href="/profile" passHref>
                {/* <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarImage src="https://picsum.photos/100?a" alt="User Profile" data-ai-hint="profile avatar user" />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar> */}
                {/* Placeholder until Avatar is used again */}
                 <Button variant="ghost" size="icon" className="h-9 w-9">
                    {/* Replace with a User icon if preferred */}
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
                 <span className="text-3xl font-bold">LastminIT</span>
                 <span className="text-2xl font-bold text-primary">tickets</span>
             </Link>
         </div>


        {/* Right side: Post Ticket Button */}
        <nav className="flex items-center">
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
