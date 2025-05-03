
'use client'; // Make this a client component to use state

import * as React from 'react';
import { Header } from '@/components/header';
import { PostTicketForm } from './_components/post-ticket-form';
import { cn } from '@/lib/utils'; // Import cn utility
import type { Ticket } from '@/services/ticket-marketplace';
import { TicketCard } from '@/components/ticket-card'; // Import TicketCard
import { Ticket as TicketIcon } from 'lucide-react'; // Import TicketIcon

export default function PostTicketPage() {
  // State to track the selected ticket type
  const [ticketType, setTicketType] = React.useState<string | undefined>(undefined);
  const [postedTickets, setPostedTickets] = React.useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Callback function for the form to update the type
  const handleTypeChange = (type: string | undefined) => {
    setTicketType(type);
  };

  const loadPostedTickets = () => {
    if (typeof window !== 'undefined') {
        setIsLoading(true);
        try {
            const stored = localStorage.getItem('userPostedTickets');
            const tickets = stored ? JSON.parse(stored) : [];
            // Filter only available tickets
            setPostedTickets(tickets.filter((t: Ticket) => t.status === 'available').reverse()); // Show newest first
        } catch (e) {
            console.error("Failed to load user's posted tickets:", e);
            setPostedTickets([]);
        } finally {
            setIsLoading(false);
        }
    } else {
      setIsLoading(false);
    }
  };


  React.useEffect(() => {
    loadPostedTickets(); // Load initially

    // Listen for changes in localStorage for both marketplace and user-posted tickets
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'userPostedTickets' || event.key === 'marketplaceTickets') {
           loadPostedTickets(); // Reload if either changes
        }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Run only on mount and unmount


  return (
    // Use cn to conditionally apply the movie poster background
    <div className={cn(
      "flex min-h-screen flex-col",
      ticketType === 'movie' ? 'bg-movie-poster' : 'bg-background' // Changed default to background
    )}>
      {/* Header background should remain consistent, maybe slightly transparent for movie poster */}
       <Header className={ticketType === 'movie' ? 'bg-card/80 backdrop-blur-sm' : ''} />
      {/* Remove explicit bottom padding pb-20/pb-12 */}
      <main className="flex-1 container py-8 md:py-12 relative z-10"> {/* Ensure content is above pseudo-element */}
        <div className="max-w-3xl mx-auto">
           {/* Adjust title color if movie type */}
            <h1 className={cn(
                "text-3xl font-bold mb-6 text-center md:text-left",
                ticketType === 'movie' ? 'text-white' : 'text-foreground'
             )}>Post a New Ticket</h1>
           <PostTicketForm onTypeChange={handleTypeChange} /> {/* Pass the callback */}
        </div>

         {/* Display User's Active Posted Tickets */}
         <div className="max-w-5xl mx-auto mt-12 md:mt-16">
             <h2 className={cn(
                 "text-2xl font-bold mb-6 text-center",
                  ticketType === 'movie' ? 'text-white' : 'text-foreground'
             )}>Your Active Listings</h2>
             {isLoading ? (
                 <p className={cn(
                    "text-center text-muted-foreground",
                     ticketType === 'movie' ? 'text-white/70' : ''
                 )}>Loading your listings...</p>
             ) : postedTickets.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {postedTickets.map((ticket) => (
                       // Use TicketCard to display, potentially with different actions or info
                       // For now, just display them. No purchase action needed here.
                       <TicketCard key={ticket.id} ticket={ticket} className="ml-2.5" />
                       // You might want a specific "ListingCard" component later
                    ))}
                 </div>
             ) : (
                <div className={cn(
                    "text-center text-muted-foreground mt-10 border border-dashed rounded-lg p-8",
                    ticketType === 'movie' ? 'bg-card/20 border-white/30 text-white/80' : 'bg-muted/30'
                 )}>
                    <TicketIcon className="mx-auto h-12 w-12 mb-4" />
                    <p>You have no active tickets listed for sale.</p>
                 </div>
             )}
         </div>
      </main>
       {/* Footer removed */}
    </div>
  );
}
