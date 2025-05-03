import { Header } from '@/components/header';
import { PostTicketForm } from './_components/post-ticket-form';

export default function PostTicketPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/20"> {/* Added background color */}
      <Header />
      <main className="flex-1 container py-8 md:py-12"> {/* Added more padding */}
        <div className="max-w-3xl mx-auto"> {/* Center content */}
           <h1 className="text-3xl font-bold mb-6 text-center md:text-left">Post a New Ticket</h1> {/* Center title on small screens */}
           <PostTicketForm />
        </div>
      </main>
      <footer className="py-4 border-t bg-background mt-auto"> {/* Ensure footer is always at bottom */}
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} LastminIT tickets. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
