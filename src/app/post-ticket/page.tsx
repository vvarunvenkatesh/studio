
'use client'; // Make this a client component to use state

import * as React from 'react';
import { Header } from '@/components/header';
import { PostTicketForm } from './_components/post-ticket-form';
import { cn } from '@/lib/utils'; // Import cn utility
import type { Ticket } from '@/services/ticket-marketplace';
import { TicketCard } from '@/components/ticket-card'; // Import TicketCard
import { Ticket as TicketIcon, Trash2, Loader2 } from 'lucide-react'; // Import TicketIcon, Trash2, Loader2
import { deleteTicket } from '@/services/ticket-marketplace'; // Import deleteTicket service
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; // Import AlertDialog
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
            // Filter only available tickets
            setPostedTickets(tickets.filter((t) => t.status === 'available').reverse()); // Show newest first
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

  // Handle deleting a ticket
  const handleDeleteTicket = async (ticketId: string) => {
    setIsDeleting(ticketId);
    try {
        const result = await deleteTicket(ticketId);
        if (result.success) {
            toast({
                title: 'Listing Deleted',
                description: 'Your ticket listing has been removed.',
            });
            // Optimistically update the UI or rely on storage event listener
             loadPostedTickets(); // Force reload after successful deletion
        } else {
            toast({
                title: 'Deletion Failed',
                description: result.message || 'Could not delete the ticket listing.',
                variant: 'destructive',
            });
        }
    } catch (error) {
        console.error('Error deleting ticket:', error);
        toast({
            title: 'Error',
            description: 'An error occurred while deleting the ticket.',
            variant: 'destructive',
        });
    } finally {
        setIsDeleting(null);
    }
  };


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
                       <div key={ticket.id} className="relative group/listing">
                            <TicketCard ticket={ticket} className="ml-2.5" />
                            {/* Delete Button Overlay */}
                            <div className="absolute top-2 right-2 z-10">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-8 w-8 opacity-80 hover:opacity-100 transition-opacity"
                                            disabled={isDeleting === ticket.id}
                                            aria-label="Delete listing"
                                        >
                                            {isDeleting === ticket.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete your ticket listing from the marketplace.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isDeleting === ticket.id}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDeleteTicket(ticket.id)}
                                            disabled={isDeleting === ticket.id}
                                            className="bg-destructive hover:bg-destructive/90"
                                        >
                                             {isDeleting === ticket.id ? 'Deleting...' : 'Delete'}
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                       </div>
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
