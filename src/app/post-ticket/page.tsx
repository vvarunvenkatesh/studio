import { Header } from '@/components/header';
import { PostTicketForm } from './_components/post-ticket-form';

export default function PostTicketPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6">Post a New Ticket</h1>
        <PostTicketForm />
      </main>
      <footer className="py-4 border-t mt-auto">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} LastminIT tickets. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
