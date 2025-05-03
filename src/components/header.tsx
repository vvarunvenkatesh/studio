import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-foreground">
          LastminIT<span className="text-primary">tickets</span>
        </Link>
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
