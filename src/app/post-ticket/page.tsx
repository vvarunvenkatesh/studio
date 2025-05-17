
'use client';

import * as React from 'react';
import { Header } from '@/components/header';
import { PostTicketForm } from './_components/post-ticket-form';
import { cn } from '@/lib/utils';
import type { Ticket } from '@/services/ticket-marketplace';
import { TicketCard } from '@/components/ticket-card';
import { Ticket as TicketIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSimulatedCurrentUserId, deleteTicket as deleteTicketService } from '@/services/ticket-marketplace';

export default function PostTicketPage() {
  const [ticketType, setTicketType] = React.useState<string | undefined>(undefined);
  const [postedTickets, setPostedTickets] = React.useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null); // Initialize as null

  // Effect to set and update currentUserId based on login state changes
  React.useEffect(() => {
    const updateCurrentUserId = () => {
      setCurrentUserId(getSimulatedCurrentUserId());
    };
    updateCurrentUserId(); // Initial set

    const handleLoginStorageChange = (event: StorageEvent) => {
      if (event.key === 'isLoggedIn' || event.key === 'userId') {
        updateCurrentUserId();
      }
    };
    window.addEventListener('storage', handleLoginStorageChange);
    return () => window.removeEventListener('storage', handleLoginStorageChange);
  }, []); 

  // Callback to load posted tickets, depends on currentUserId
  const loadPostedTickets = React.useCallback(() => {
    if (typeof window !== 'undefined' && currentUserId && currentUserId !== 'anonymousUser') {
        setIsLoading(true);
        try {
            const allMarketplaceTicketsString = localStorage.getItem('marketplaceTickets');
            const allMarketplaceTickets: Ticket[] = allMarketplaceTicketsString ? JSON.parse(allMarketplaceTicketsString) : [];
            
            const userActiveListings = allMarketplaceTickets.filter(
                ticket => ticket.sellerId === currentUserId && ticket.status === 'available'
            );
            setPostedTickets(userActiveListings.reverse());
        } catch (e) {
            console.error("Failed to load user's active listings:", e);
            setPostedTickets([]);
        } finally {
            setIsLoading(false);
        }
    } else {
      setPostedTickets([]); 
      setIsLoading(false);
    }
  }, [currentUserId, setIsLoading, setPostedTickets]);

  // Effect to load tickets when currentUserId is available or marketplaceTickets change
  React.useEffect(() => {
    // Only load if currentUserId is determined (not null)
    // This ensures loadPostedTickets runs with the correct ID for filtering
    if (currentUserId !== null) { 
      loadPostedTickets();
    }

    const handleMarketplaceStorageChange = (event: StorageEvent) => {
      if (event.key === 'marketplaceTickets') {
        // Reload tickets if marketplaceTickets itself changes,
        // but only if currentUserId is already determined.
        if (currentUserId !== null) {
            loadPostedTickets(); 
        }
      }
    };
    window.addEventListener('storage', handleMarketplaceStorageChange);
    return () => window.removeEventListener('storage', handleMarketplaceStorageChange);
  }, [currentUserId, loadPostedTickets]); 

  const handleTypeChange = (type: string | undefined) => {
    setTicketType(type);
  };

  const handleDeleteTicket = async (ticketId: string) => {
    setIsDeleting(ticketId);
    try {
        // Call service directly
        const result = await deleteTicketService(ticketId); 

        if (result.success) {
            toast({
                title: 'Listing Cancelled',
                description: result.message || 'Your ticket listing has been removed.',
            });
            // loadPostedTickets will be called by the storage event listener for 'marketplaceTickets'
        } else {
            throw new Error(result.message || 'Could not cancel the ticket listing.');
        }
    } catch (error: any) {
        console.error('Error cancelling ticket listing:', error);
        toast({
            title: 'Error Cancelling Listing',
            description: error.message || 'An error occurred while cancelling the listing.',
            variant: 'destructive',
        });
    } finally {
        setIsDeleting(null);
    }
  };

  return (
    <div className={cn(
      "flex min-h-screen flex-col pb-16 md:pb-0",
      ticketType === 'movie' ? 'bg-movie-poster' : 'bg-background'
    )}>
       <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 relative z-10">
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center md:text-left text-foreground">Post a New Ticket</h1>
           <PostTicketForm onTypeChange={handleTypeChange} />
        </div>
         <div className="max-w-5xl mx-auto mt-12 md:mt-16">
             <h2 className="text-2xl font-bold mb-6 text-center text-foreground">Your Active Listings</h2>
             {isLoading ? (
                 <p className="text-center text-muted-foreground">Loading your listings...</p>
             ) : postedTickets.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {postedTickets.map((ticket) => (
                       <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            variant="manage" // For "Your Active Listings", the user is always the seller
                            isSeller={true} 
                            onCancelListing={handleDeleteTicket}
                            isCancelling={isDeleting === ticket.id}
                            className="ml-0 md:ml-0" 
                        />
                    ))}
                 </div>
             ) : (
                <div className="text-center text-muted-foreground mt-10 border border-dashed rounded-lg p-8 bg-muted/30">
                    <TicketIcon className="mx-auto h-12 w-12 mb-4" />
                    <p>{currentUserId && currentUserId !== 'anonymousUser' ? "You have no active tickets listed for sale." : "Please log in to see your active listings."}</p>
                 </div>
             )}
         </div>
      </main>
    </div>
  );
}

    