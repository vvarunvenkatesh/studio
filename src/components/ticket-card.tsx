'use client'; // Make this a client component for interaction

import * as React from 'react';
import type { Ticket } from '@/services/ticket-marketplace';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Import Button
import { Calendar, MapPin, Ticket as TicketIcon, DollarSign, ShoppingCart, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { purchaseTicket } from '@/services/ticket-marketplace'; // Import purchase function

interface TicketCardProps {
  ticket: Ticket;
  onPurchaseSuccess?: (ticketId: string) => void; // Optional callback for successful purchase
}

export function TicketCard({ ticket, onPurchaseSuccess }: TicketCardProps) {
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const [isSold, setIsSold] = React.useState(ticket.status === 'sold'); // Local state to track if sold

  const formattedDate = format(new Date(ticket.date), 'PPP'); // Format date nicely

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
        // Optionally re-sync sold status if purchase failed because it was already sold
        if (result.message.includes('already sold')) {
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
    <Card className={`flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200 ${isSold ? 'opacity-60 bg-muted/50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
           <CardTitle className="text-lg font-semibold capitalize flex items-center">
             <TicketIcon className="mr-2 h-5 w-5 text-primary" />
             {ticket.type} Ticket
           </CardTitle>
           <Badge variant={isSold ? 'destructive' : 'secondary'} className="text-xs">{ticket.id}</Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground line-clamp-2 h-10"> {/* Fixed height for description */}
            {ticket.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
         <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{formattedDate}</span>
         </div>
         <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="truncate">{ticket.location}</span> {/* Truncate long locations */}
         </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4 mt-auto"> {/* Ensure footer is at the bottom */}
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
