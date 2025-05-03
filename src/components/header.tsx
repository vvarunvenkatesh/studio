
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Header() {
  return (
    // Keep header background white (bg-card)
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center justify-between relative">

         {/* Profile Icon or Placeholder */}
         <div className="md:ml-4"> {/* Added margin for desktop view */}
           <Avatar className="h-9 w-9 cursor-pointer">
              <AvatarImage src="https://picsum.photos/100?a" alt="User Profile" data-ai-hint="profile avatar user" />
              <AvatarFallback>U</AvatarFallback>
           </Avatar>
         </div>

        {/* Centered Title - Adjusted font sizes and alignment */}
         <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-card-foreground whitespace-nowrap flex items-baseline gap-1">
             <span className="text-3xl font-bold">LastminIT</span>
             <span className="text-2xl font-bold text-primary">tickets</span>
         </Link>


        {/* Navigation/Actions on the right */}
        <nav className="ml-auto md:mr-4"> {/* Adjusted margin for desktop */}
          <Button asChild variant="default" size="sm">
            <Link href="/post-ticket" className="gap-2">
              <PlusCircle className="h-4 w-4" /> Post Ticket
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
