'use client'; // Convert to client component to manage ticket state

import * as React from 'react';
import { Header } from '@/components/header';
import { TicketCard } from '@/components/ticket-card';
import { getAvailableTickets, type Ticket } from '@/services/ticket-marketplace';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

export default function Home() {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch tickets on component mount
  React.useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedTickets = await getAvailableTickets();
        setTickets(fetchedTickets);
      } catch (err) {
        console.error("Failed to fetch tickets:", err);
        setError("Failed to load tickets. Please try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // Callback function to remove purchased ticket from the list
  const handlePurchaseSuccess = (purchasedTicketId: string) => {
    setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== purchasedTicketId));
  };

  const renderSkeletons = () => (
    Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="flex flex-col space-y-3">
        <Skeleton className="h-[125px] w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
           <Skeleton className="h-4 w-1/4" />
        </div>
         <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-8 w-1/3" />
        </div>
      </div>
    ))
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Available Tickets</h1>

        {error && (
          <div className="text-center text-destructive mt-10">
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {renderSkeletons()}
           </div>
        ) : tickets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onPurchaseSuccess={handlePurchaseSuccess} // Pass the callback
              />
            ))}
          </div>
        ) : !error ? ( // Only show "No tickets" if not loading and no error
          <div className="text-center text-muted-foreground mt-10 border border-dashed rounded-lg p-8">
            <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Tickets Available</h2>
            <p>It looks like all tickets have been sold or none are listed currently.</p>
            <p>Check back later or post your own ticket!</p>
          </div>
        ) : null}
      </main>
       <footer className="py-4 border-t bg-background mt-10">
         <div className="container text-center text-sm text-muted-foreground">
           © {new Date().getFullYear()} LastminIT tickets. All rights reserved.
         </div>
       </footer>
    </div>
  );
}
