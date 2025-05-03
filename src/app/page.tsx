import { Header } from '@/components/header';
import { TicketCard } from '@/components/ticket-card';
import { getAvailableTickets, type Ticket } from '@/services/ticket-marketplace';

export default async function Home() {
  const tickets: Ticket[] = await getAvailableTickets();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6">Available Tickets</h1>
        {tickets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground mt-10">
            <p>No tickets currently available. Check back later!</p>
          </div>
        )}
      </main>
       <footer className="py-4 border-t">
         <div className="container text-center text-sm text-muted-foreground">
           © {new Date().getFullYear()} LastminIT tickets. All rights reserved.
         </div>
       </footer>
    </div>
  );
}
