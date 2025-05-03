
'use client'; // Make this a client component for interaction

import * as React from 'react';
import type { Ticket } from '@/services/ticket-marketplace';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Ticket as TicketIcon, DollarSign, ShoppingCart, Loader2, ArrowRight, Bus, Train, Film, Calendar as CalendarIconLucide, Ticket as TicketCategoryIcon, Download } from 'lucide-react'; // Added specific icons, Download
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { purchaseTicket } from '@/services/ticket-marketplace';
import { cn } from '@/lib/utils'; // Import cn

interface TicketCardProps {
  ticket: Ticket;
  onPurchaseSuccess?: (ticketId: string, purchasedTicket: Ticket) => void; // Update callback to include ticket data
  className?: string; // Add className prop
}

// Mapping for category icons
const categoryIconMap: Record<Ticket['type'], React.ElementType> = {
    bus: Bus,
    train: Train,
    movie: Film,
    event: CalendarIconLucide,
    sports: TicketCategoryIcon, // Added sports icon
};

export function TicketCard({ ticket, onPurchaseSuccess, className }: TicketCardProps) { // Accept className prop
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  // Use state to hold the full ticket data, including the data URI if purchased
  const [currentTicket, setCurrentTicket] = React.useState<Ticket>(ticket);
  const [isSold, setIsSold] = React.useState(ticket.status === 'sold');

  // Update local state if the initial ticket prop changes (e.g., parent re-renders with new data)
  React.useEffect(() => {
      setCurrentTicket(ticket);
      setIsSold(ticket.status === 'sold');
  }, [ticket]);


  const formattedDate = format(new Date(currentTicket.date), 'PPP'); // Format date nicely
  const CategorySpecificIcon = categoryIconMap[currentTicket.type] || TicketIcon; // Get specific icon or default


  const handlePurchase = async () => {
    if (isSold) return; // Prevent buying if already sold locally

    setIsPurchasing(true);
    try {
      const result = await purchaseTicket(currentTicket.id);
      if (result.success && result.ticket) {
        toast({
          title: 'Purchase Successful!',
          description: `You have successfully bought the ${result.ticket.type} ticket (ID: ${result.ticket.id}).`,
        });
        setIsSold(true); // Update local state to reflect sold status
        setCurrentTicket(result.ticket); // Update ticket data with potentially new status and URI
        if (onPurchaseSuccess) {
          onPurchaseSuccess(result.ticket.id, result.ticket); // Notify parent component with full ticket data
        }
      } else {
        toast({
          title: 'Purchase Failed',
          description: result.message || 'Could not purchase the ticket. It might be already sold.',
          variant: 'destructive',
        });
        // If purchase failed because it was already sold, update local state
        if (result.message?.includes('already sold') && result.ticket) {
           setIsSold(true);
           setCurrentTicket(result.ticket);
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

   // Function to handle downloading the original ticket
   const handleDownload = () => {
     if (currentTicket.originalTicketDataUri) {
       try {
          const link = document.createElement('a');
          link.href = currentTicket.originalTicketDataUri;

          // Attempt to extract file extension from MIME type in data URI
          let fileExtension = 'file';
          const mimeMatch = currentTicket.originalTicketDataUri.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
          if (mimeMatch && mimeMatch[1]) {
            const mimeType = mimeMatch[1];
            // Basic mapping, can be expanded
            const extensionMap: Record<string, string> = {
              'image/jpeg': 'jpg',
              'image/png': 'png',
              'image/gif': 'gif',
              'application/pdf': 'pdf',
              'application/msword': 'doc',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            };
            fileExtension = extensionMap[mimeType] || fileExtension;
          }

          const filename = `ticket_${currentTicket.type}_${currentTicket.id}.${fileExtension}`;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast({
            title: 'Download Started',
            description: `Downloading ${filename}...`
          })
        } catch (error) {
            console.error("Error preparing download:", error);
             toast({
               title: 'Download Failed',
               description: 'Could not prepare the file for download.',
               variant: 'destructive'
             })
        }
     } else {
        toast({
          title: 'Download Failed',
          description: 'No original ticket file available for download.',
          variant: 'destructive'
        })
     }
   };


  return (
    <Card className={cn(
        "flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200",
        isSold ? 'opacity-60 bg-muted/50' : 'bg-card',
        className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between mb-1">
           <CardTitle className="text-lg font-semibold capitalize flex items-center mr-2">
             <CategorySpecificIcon className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
             <span className="truncate">{currentTicket.type} Ticket</span>
           </CardTitle>
           <Badge variant={isSold ? 'destructive' : 'secondary'} className="text-xs whitespace-nowrap flex-shrink-0">ID: {currentTicket.id}</Badge>
        </div>
         <CardDescription className="text-sm text-muted-foreground line-clamp-2 h-10">
             {currentTicket.description}
         </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1.5 text-sm pt-2">
         {(currentTicket.type === 'train' || currentTicket.type === 'bus') && currentTicket.fromCity && currentTicket.toCity && (
             <div className="flex items-center font-medium">
                <span className="truncate">{currentTicket.fromCity}</span>
                <ArrowRight className="mx-1 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{currentTicket.toCity}</span>
             </div>
         )}
          {(currentTicket.type === 'event' || currentTicket.type === 'movie' || currentTicket.type === 'sports') && currentTicket.location && (
             <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{currentTicket.location}</span>
             </div>
         )}
         {(currentTicket.type === 'train' || currentTicket.type === 'bus') && currentTicket.location && (!currentTicket.fromCity || !currentTicket.toCity) && (
             <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="mr-1 h-3 w-3 flex-shrink-0" />
                <span className="truncate">{currentTicket.location}</span>
             </div>
          )}

         <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{formattedDate}</span>
         </div>
         <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{currentTicket.time}</span>
         </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4 mt-auto">
         <div className="flex items-center font-semibold text-lg text-primary">
             <DollarSign className="mr-1 h-5 w-5" />
             {currentTicket.price.toFixed(2)}
         </div>
         {isSold ? (
             // If sold and original ticket data exists, show Download button
             currentTicket.originalTicketDataUri ? (
                <Button
                    size="sm"
                    variant="secondary" // Or another appropriate variant
                    onClick={handleDownload}
                    aria-label="Download original ticket"
                    className="gap-2"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                </Button>
             ) : (
                // If sold but no file exists, show Sold badge
                <Badge variant="destructive">Sold</Badge>
             )
         ) : (
            // If not sold, show Buy button
            <Button
              size="sm"
              onClick={handlePurchase}
              disabled={isPurchasing}
              aria-label={`Buy ${currentTicket.type} ticket for $${currentTicket.price.toFixed(2)}`}
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

