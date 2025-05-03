
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Header() {
  return (
    // Changed bg-background to bg-card to use a slightly different shade for the header
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center justify-between relative"> {/* Added relative positioning */}

         {/* Profile Icon or Placeholder */}
         {/* Added md:ml-4 for desktop left margin */}
         <Avatar className="h-9 w-9 cursor-pointer md:ml-4">
            <AvatarImage src="https://picsum.photos/100?a" alt="User Profile" data-ai-hint="profile avatar user" /> {/* Added data-ai-hint */}
            <AvatarFallback>U</AvatarFallback>
         </Avatar>

        {/* Centered Title */}
         <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-card-foreground whitespace-nowrap">
             LastminIT<span className="text-primary">tickets</span>
         </Link>


        {/* Navigation/Actions on the right */}
        {/* Added ml-auto to push the nav to the right */}
        <nav className="ml-auto">
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

