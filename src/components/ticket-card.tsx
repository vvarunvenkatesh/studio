
'use client'; // Make this a client component for interaction

import * as React from 'react';
import type { Ticket } from '@/services/ticket-marketplace';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Ticket as TicketIcon, DollarSign, ShoppingCart, Loader2, ArrowRight, Bus, Train, Film, Calendar as CalendarIconLucide, Ticket as TicketCategoryIcon } from 'lucide-react'; // Added specific icons
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { purchaseTicket } from '@/services/ticket-marketplace';

interface TicketCardProps {
  ticket: Ticket;
  onPurchaseSuccess?: (ticketId: string) => void; // Optional callback for successful purchase
}

// Mapping for category icons
const categoryIconMap: Record<Ticket['type'], React.ElementType> = {
    bus: Bus,
    train: Train,
    movie: Film,
    event: CalendarIconLucide,
    sports: TicketCategoryIcon, // Added sports icon
};

export function TicketCard({ ticket, onPurchaseSuccess }: TicketCardProps) {
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const [isSold, setIsSold] = React.useState(ticket.status === 'sold'); // Local state to track if sold

  const formattedDate = format(new Date(ticket.date), 'PPP'); // Format date nicely
  const CategorySpecificIcon = categoryIconMap[ticket.type] || TicketIcon; // Get specific icon or default


  const handlePurchase = async () => {
    if (isSold) return; // Prevent buying if already sold locally

    setIsPurchasing(true);
    try {
      const result = await purchaseTicket(ticket.id);
      if (result.success) {
        toast({
          title: 'Purchase Successful!',
          description: `You have successfully bought the ${ticket.type} ticket (ID: ${ticket.id}).`,
        });
        setIsSold(true); // Update local state to reflect sold status
        if (onPurchaseSuccess) {
          onPurchaseSuccess(ticket.id); // Notify parent component if needed
        }
      } else {
        toast({
          title: 'Purchase Failed',
          description: result.message || 'Could not purchase the ticket. It might be already sold.',
          variant: 'destructive',
        });
        if (result.message?.includes('already sold')) {
           setIsSold(true);
        }
      }
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      toast({
        title: 'Purchase Error',
        description: 'Something went wrong during the purchase. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Card className={`flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200 ${isSold ? 'opacity-60 bg-muted/50' : 'bg-card'}`}> {/* Use bg-card for non-sold */}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between mb-1">
           <CardTitle className="text-lg font-semibold capitalize flex items-center mr-2">
             <CategorySpecificIcon className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
             <span className="truncate">{ticket.type} Ticket</span>
           </CardTitle>
           <Badge variant={isSold ? 'destructive' : 'secondary'} className="text-xs whitespace-nowrap flex-shrink-0">ID: {ticket.id}</Badge>
        </div>
         <CardDescription className="text-sm text-muted-foreground line-clamp-2 h-10">
             {ticket.description}
         </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1.5 text-sm pt-2">
         {/* Route for Train/Bus */}
         {(ticket.type === 'train' || ticket.type === 'bus') && ticket.fromCity && ticket.toCity && (
             <div className="flex items-center font-medium">
                <span className="truncate">{ticket.fromCity}</span>
                <ArrowRight className="mx-1 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{ticket.toCity}</span>
             </div>
         )}
         {/* Location for Event/Movie/Sports */}
          {(ticket.type === 'event' || ticket.type === 'movie' || ticket.type === 'sports') && ticket.location && ( // Added 'sports'
             <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{ticket.location}</span>
             </div>
         )}
          {/* Optional Location Detail for Train/Bus */}
         {(ticket.type === 'train' || ticket.type === 'bus') && ticket.location && (!ticket.fromCity || !ticket.toCity) && (
             <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="mr-1 h-3 w-3 flex-shrink-0" />
                <span className="truncate">{ticket.location}</span>
             </div>
          )}

         <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{formattedDate}</span>
         </div>
         <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{ticket.time}</span>
         </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4 mt-auto">
         <div className="flex items-center font-semibold text-lg text-primary">
             <DollarSign className="mr-1 h-5 w-5" />
             {ticket.price.toFixed(2)}
         </div>
         {isSold ? (
            <Badge variant="destructive">Sold</Badge>
         ) : (
            <Button
              size="sm"
              onClick={handlePurchase}
              disabled={isPurchasing}
              aria-label={`Buy ${ticket.type} ticket for $${ticket.price.toFixed(2)}`}
              className="gap-2"
            >
              {isPurchasing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShoppingCart className="mr-2 h-4 w-4" />
              )}
              {isPurchasing ? 'Processing...' : 'Buy Ticket'}
            </Button>
         )}
      </CardFooter>
    </Card>
  );
}
