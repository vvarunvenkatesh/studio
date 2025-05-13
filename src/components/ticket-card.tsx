
'use client';

import * as React from 'react';
import type { Ticket } from '@/services/ticket-marketplace';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Clock, Ticket as TicketIconLucide, IndianRupeeIcon, ShoppingCart, Loader2, ArrowRight, Bus, Train, Film, Calendar as CalendarIconLucideElement, Ticket as TicketCategoryIcon, Download, XCircle, Hourglass, LogIn } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
// Removed direct import of purchaseTicket service
import { cn } from '@/lib/utils';
import { useRouter, usePathname, useSearchParams as useNextSearchParams } from 'next/navigation';
import { getSimulatedCurrentUserId } from '@/services/ticket-marketplace'; // Import helper

interface TicketCardProps {
  ticket: Ticket;
  variant?: 'browse' | 'manage';
  onPurchaseSuccess?: (ticketId: string) => void;
  onCancelListing?: (ticketId: string) => Promise<void> | void;
  isCancelling?: boolean;
  className?: string;
  isSeller?: boolean;
}

const categoryIconMap: Record<Ticket['type'], React.ElementType> = {
    bus: Bus,
    train: Train,
    movie: Film,
    event: CalendarIconLucideElement,
    sports: TicketCategoryIcon,
};

export function TicketCard({
    ticket,
    variant = 'browse',
    onPurchaseSuccess,
    onCancelListing,
    isCancelling,
    className,
    isSeller = false
}: TicketCardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsHook = useNextSearchParams();

  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [showLoginDialog, setShowLoginDialog] = React.useState(false);
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const [currentTicket, setCurrentTicket] = React.useState<Ticket>(ticket);
  const [isSold, setIsSold] = React.useState(ticket.status === 'sold');
  const [currentUserId, setCurrentUserIdState] = React.useState<string | null>(null);


  React.useEffect(() => {
      if (typeof window !== 'undefined') {
          const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
          setIsLoggedIn(loggedInStatus);
          setCurrentUserIdState(getSimulatedCurrentUserId()); // Set current user ID
      }
      const handleStorageChange = (event: StorageEvent) => {
          if (event.key === 'isLoggedIn') {
              const newLoggedInStatus = event.newValue === 'true';
              setIsLoggedIn(newLoggedInStatus);
              setCurrentUserIdState(getSimulatedCurrentUserId()); // Update current user ID
          }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => {
          window.removeEventListener('storage', handleStorageChange);
      };
  }, []);


  React.useEffect(() => {
      setCurrentTicket(ticket);
      setIsSold(ticket.status === 'sold');
  }, [ticket]);


  const formattedDate = format(new Date(currentTicket.date), 'PPP');
  const CategorySpecificIcon = categoryIconMap[currentTicket.type] || TicketIconLucide;

  const redirectToLogin = () => {
    const currentRedirectPath = pathname + '?' + searchParamsHook.toString();
    router.push(`/login?redirect=${encodeURIComponent(currentRedirectPath)}`);
  };


  const handlePurchase = async () => {
    if (!isLoggedIn) {
        setShowLoginDialog(true);
        return;
    }
    if (isSold || isSeller) return;
    setIsPurchasing(true);
    try {
      const response = await fetch('/api/orders/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: currentTicket.id }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.ticket) {
        toast({
          title: 'Purchase Successful!',
          description: `You have successfully bought the ${result.ticket.type} ticket (ID: ${result.ticket.id}).`,
        });
        setIsSold(true);
        setCurrentTicket(result.ticket);
        if (onPurchaseSuccess) {
          onPurchaseSuccess(result.ticket.id);
        }
      } else {
        toast({
          title: 'Purchase Failed',
          description: result.message || 'Could not purchase the ticket.',
          variant: 'destructive',
        });
        if (result.ticket && result.message?.includes('already sold')) {
           setIsSold(true);
           setCurrentTicket(result.ticket);
           if (onPurchaseSuccess) {
              onPurchaseSuccess(result.ticket.id);
           }
        }
      }
    } catch (error: any) {
      console.error('Error purchasing ticket:', error);
      toast({
        title: 'Purchase Error',
        description: error.message || 'Something went wrong during the purchase.',
        variant: 'destructive',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

   const handleDownload = (dataUri: string | undefined, ticketId: string, ticketType: string) => {
     if (dataUri) {
       try {
          const link = document.createElement('a');
          link.href = dataUri;
          let fileExtension = 'file';
          const mimeMatch = dataUri.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
          if (mimeMatch && mimeMatch[1]) {
            const mimeType = mimeMatch[1];
            const extensionMap: Record<string, string> = {
              'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
              'application/pdf': 'pdf', 'application/msword': 'doc',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            };
            fileExtension = extensionMap[mimeType] || fileExtension;
          }
          const filename = `ticket_${ticketType}_${ticketId}.${fileExtension}`;
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

  const renderCancelButton = () => (
    <AlertDialog>
        <AlertDialogTrigger asChild>
            <Button
                size="sm"
                variant="destructive"
                disabled={isCancelling}
                aria-label="Cancel ticket listing"
                className="gap-2"
            >
                {isCancelling ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                )}
                {isCancelling ? 'Cancelling...' : 'Cancel Listing'}
            </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently remove your ticket listing from the marketplace. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Keep Listing</AlertDialogCancel>
                <AlertDialogAction onClick={() => onCancelListing?.(currentTicket.id)} className={cn(buttonVariants({ variant: "destructive" }))}>
                    Cancel Listing
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  );

  const renderPendingIndicator = () => (
    <Badge
      variant="outline"
      className="text-xs text-black gap-1.5 border-amber-500"
      style={{ backgroundColor: '#FFCE54' }}
    >
      <Hourglass className="h-3 w-3" />
      Pending Sale
    </Badge>
  );

  // Determine actual seller status based on currentUserId
  const actualIsSeller = !!currentUserId && currentTicket.sellerId === currentUserId && currentUserId !== 'anonymousUser';

  return (
    <>
    <Card className={cn(
        "flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200 h-full bg-card",
        className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between mb-1">
           <CardTitle className="text-lg font-semibold capitalize flex items-center mr-2 text-foreground">
             <CategorySpecificIcon className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
             <span className="truncate">{currentTicket.type} Ticket</span>
           </CardTitle>
           <Badge variant={isSold ? 'destructive' : 'secondary'} className={cn("text-xs whitespace-nowrap flex-shrink-0", (variant === 'manage') ? 'mr-1' : '')}>ID: {currentTicket.id}</Badge>
        </div>
         <CardDescription className="text-sm text-muted-foreground line-clamp-2 h-10">
             {currentTicket.description}
         </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1.5 text-sm pt-2 flex-grow text-foreground">
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
             <IndianRupeeIcon className="mr-1 h-5 w-5" />
             {currentTicket.price.toFixed(2)}
         </div>
         {isSold ? (
             currentTicket.originalTicketDataUri ? (
                 <Button
                     size="sm"
                     onClick={() => handleDownload(currentTicket.originalTicketDataUri, currentTicket.id, currentTicket.type)}
                     aria-label="Download original ticket"
                     className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                 >
                     <Download className="mr-2 h-4 w-4" />
                     Download
                 </Button>
             ) : (
                 <Badge variant="destructive">Sold</Badge>
             )
         ) : actualIsSeller ? (
             variant === 'manage' ? renderCancelButton() : renderPendingIndicator()
         ) : (
             <Button
                 size="sm"
                 onClick={handlePurchase}
                 disabled={isPurchasing}
                 aria-label={`Buy ${currentTicket.type} ticket for ₹${currentTicket.price.toFixed(2)}`}
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
     <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be logged in to purchase a ticket. Please log in or create an account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={redirectToLogin} className="gap-2">
              <LogIn className="h-4 w-4" /> Go to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const getUniqueById = <T extends { id: string }>(items: T[]): T[] => {
    const seenIds = new Set<string>();
    return items.filter(item => {
        if (!item || typeof item.id === 'undefined') {
            console.warn("Encountered invalid item object:", item);
            return false;
        }
        if (seenIds.has(item.id)) {
            return false;
        }
        seenIds.add(item.id);
        return true;
    });
};
