
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Added Avatar


export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
         {/* Profile Icon or Placeholder */}
         <Avatar className="h-9 w-9 cursor-pointer">
            <AvatarImage src="https://picsum.photos/100?a" alt="User Profile" data-ai-hint="profile avatar user" /> {/* Added data-ai-hint */}
            <AvatarFallback>U</AvatarFallback>
         </Avatar>

        {/* Centered Title - This is now handled on the Home page specifically */}
         <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-foreground whitespace-nowrap">
             LastminIT<span className="text-primary">tickets</span>
         </Link>


        {/* Navigation/Actions on the right */}
        <nav>
          <Button asChild>
            <Link href="/post-ticket">
              <PlusCircle className="mr-2 h-4 w-4" /> Post Ticket
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
