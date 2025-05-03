
'use client'; // Make this a client component to use state

import * as React from 'react';
import { Header } from '@/components/header';
import { PostTicketForm } from './_components/post-ticket-form';
import { cn } from '@/lib/utils'; // Import cn utility
import type { Ticket } from '@/services/ticket-marketplace';
import { TicketCard } from '@/components/ticket-card'; // Import TicketCard
import { Ticket as TicketIcon, Loader2 } from 'lucide-react'; // Import TicketIcon, Loader2
import { deleteTicket } from '@/services/ticket-marketplace'; // Import deleteTicket service
import { useToast } from '@/hooks/use-toast'; // Import useToast
// AlertDialog components are no longer directly needed here for delete, but kept for potential future use
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button'; // Import Button

export default function PostTicketPage() {
  // State to track the selected ticket type
  const [ticketType, setTicketType] = React.useState<string | undefined>(undefined);
  const [postedTickets, setPostedTickets] = React.useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null); // Track which ticket is being deleted
  const { toast } = useToast(); // Get toast

  // Callback function for the form to update the type
  const handleTypeChange = (type: string | undefined) => {
    setTicketType(type);
  };

  const loadPostedTickets = React.useCallback(() => {
    if (typeof window !== 'undefined') {
        setIsLoading(true);
        try {
            const stored = localStorage.getItem('userPostedTickets');
            const tickets: Ticket[] = stored ? JSON.parse(stored) : [];
            // Filter only available tickets (or show all user posted regardless of status?)
            // Let's show all for now, the card will show "Sold" status
            setPostedTickets(tickets.reverse()); // Show newest first
        } catch (e) {
            console.error("Failed to load user's posted tickets:", e);
            setPostedTickets([]);
        } finally {
            setIsLoading(false);
        }
    } else {
      setIsLoading(false);
    }
  }, []); // Memoize load function


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
  }, [loadPostedTickets]); // Depend on memoized load function

  // Handle deleting/cancelling a ticket listing
  const handleDeleteTicket = async (ticketId: string) => {
    setIsDeleting(ticketId);
    try {
        const result = await deleteTicket(ticketId);
        if (result.success) {
            toast({
                title: 'Listing Cancelled',
                description: 'Your ticket listing has been removed.',
            });
            // Optimistically update the UI or rely on storage event listener
             loadPostedTickets(); // Force reload after successful deletion
        } else {
            toast({
                title: 'Cancellation Failed',
                description: result.message || 'Could not cancel the ticket listing.',
                variant: 'destructive',
            });
        }
    } catch (error) {
        console.error('Error cancelling ticket listing:', error);
        toast({
            title: 'Error',
            description: 'An error occurred while cancelling the listing.',
            variant: 'destructive',
        });
    } finally {
        setIsDeleting(null);
    }
  };


  return (
    // Use cn to conditionally apply the movie poster background
    <div className={cn(
      "flex min-h-screen flex-col pb-16 md:pb-0", // Added padding bottom for bottom nav
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
                        // Removed the outer div with relative group/listing and the delete overlay
                       <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            variant="manage" // Specify the manage variant
                            onCancelListing={handleDeleteTicket} // Pass the cancel handler
                            isCancelling={isDeleting === ticket.id} // Pass the loading state
                            className="ml-2.5"
                        />
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

