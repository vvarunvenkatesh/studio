
'use client';

import * as React from 'react';
import type { Ticket } from '@/services/ticket-marketplace';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Clock, Ticket as TicketIconLucide, IndianRupeeIcon, ShoppingCart, Loader2, ArrowRight, Bus, Train, Film, Calendar as CalendarIconLucideElement, Ticket as TicketCategoryIcon, Download, XCircle, Hourglass, LogIn, ShieldCheck, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter, usePathname, useSearchParams as useNextSearchParams } from 'next/navigation';
import { getSimulatedCurrentUserId } from '@/services/ticket-marketplace';

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
    isSeller: propIsSeller
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
          setCurrentUserIdState(getSimulatedCurrentUserId());
      }
      const handleStorageChange = (event: StorageEvent) => {
          if (event.key === 'isLoggedIn') {
              const newLoggedInStatus = event.newValue === 'true';
              setIsLoggedIn(newLoggedInStatus);
              setCurrentUserIdState(getSimulatedCurrentUserId());
          }
           if (event.key === 'marketplaceTickets') {
                const updatedTickets: Ticket[] = event.newValue ? JSON.parse(event.newValue) : [];
                const thisTicketUpdate = updatedTickets.find(t => t.id === currentTicket.id);
                if (thisTicketUpdate) {
                    setCurrentTicket(thisTicketUpdate);
                    setIsSold(thisTicketUpdate.status === 'sold');
                } else {
                    setIsSold(true); // If ticket no longer in marketplace, assume sold or removed
                }
            }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => {
          window.removeEventListener('storage', handleStorageChange);
      };
  }, [currentTicket.id]);


  React.useEffect(() => {
      setCurrentTicket(ticket);
      setIsSold(ticket.status === 'sold');
  }, [ticket]);


  const formattedDate = format(new Date(currentTicket.date), 'PPP');
  const CategorySpecificIcon = categoryIconMap[currentTicket.type] || TicketIconLucide;
  const actualIsSeller = !!currentUserId && currentTicket.sellerId === currentUserId && currentUserId !== 'anonymousUser';


  const redirectToLogin = () => {
    // If on tickets page, include current search params for redirect
    // Otherwise, just redirect to login
    const baseRedirectPath = pathname.startsWith('/tickets') ? pathname + '?' + searchParamsHook.toString() : pathname;
    router.push(`/login?redirect=${encodeURIComponent(baseRedirectPath)}`);
  };


  const handlePurchase = async () => {
    if (!isLoggedIn) {
        setShowLoginDialog(true);
        return;
    }
    if (isSold || actualIsSeller) return; // Should not happen if button is disabled, but good check
    setIsPurchasing(true);
    try {
      // In a real app, this would go to an API endpoint that handles payment.
      // For now, it directly calls the service function.
      const response = await fetch('/api/orders/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: currentTicket.id }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.ticket) {
        toast({
          title: 'Purchase Initiated!',
          description: `Contact the seller at ${result.ticket.sellerContactEmail || 'their listed email'} to complete your purchase.`,
          variant: 'success',
          duration: 7000,
        });
        setIsSold(true); // Mark as sold to update UI
        setCurrentTicket(result.ticket);
        if (onPurchaseSuccess) {
          onPurchaseSuccess(result.ticket.id);
        }
      } else {
        toast({
          title: 'Purchase Failed',
          description: result.message || 'Could not initiate purchase for the ticket.',
          variant: 'destructive',
        });
        // If server confirms it's already sold, update UI
        if (result.ticket && result.message?.includes('already sold')) {
           setIsSold(true);
           setCurrentTicket(result.ticket);
           if (onPurchaseSuccess) { // Notify parent to re-filter if needed
              onPurchaseSuccess(result.ticket.id);
           }
        }
      }
    } catch (error: any) {
      console.error('Error initiating purchase:', error);
      toast({
        title: 'Purchase Error',
        description: error.message || 'Something went wrong during the purchase initiation.',
        variant: 'destructive',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

   const handleDownload = async (dataUri: string | undefined, ticketId: string, ticketType: string) => {
     if (!dataUri) {
       toast({ title: 'Download Failed', description: 'No file available.', variant: 'destructive' });
       return;
     }

     const link = document.createElement('a');
     let fileExtension = 'file';
     const mimeMatch = dataUri.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
     let isImage = false;
     let mimeType = '';

     if (mimeMatch && mimeMatch[1]) {
       mimeType = mimeMatch[1];
       const extensionMap: Record<string, string> = {
         'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
         'application/pdf': 'pdf', 'application/msword': 'doc',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
       };
       fileExtension = extensionMap[mimeType] || fileExtension;
       isImage = mimeType.startsWith('image/');
     }
     const baseFilename = `ticket_${ticketType}_${ticketId}`;
     const watermarkedFilename = `${baseFilename}_watermarked.${fileExtension}`;
     const originalFilename = `${baseFilename}.${fileExtension}`;

     if (isImage) {
       try {
         const img = new Image();
         img.onload = () => {
           const canvas = document.createElement('canvas');
           canvas.width = img.width;
           canvas.height = img.height;
           const ctx = canvas.getContext('2d');
           if (!ctx) {
             toast({ title: 'Watermark Failed', description: 'Could not process image.', variant: 'destructive' });
             link.href = dataUri;
             link.download = originalFilename;
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
             return;
           }

           ctx.drawImage(img, 0, 0);

           const fontSize = Math.max(12, Math.min(img.width / 20, img.height / 15));
           ctx.font = `bold ${fontSize}px Arial`;
           ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
           ctx.textAlign = 'center';
           ctx.textBaseline = 'middle';

           const watermarkText = `Sold via LastMiniT - ID: ${ticketId.substring(0,8)}`;
           const x = canvas.width / 2;
           const y = canvas.height / 2;

           ctx.fillText(watermarkText, x, y);

           link.href = canvas.toDataURL(mimeType);
           link.download = watermarkedFilename;
           document.body.appendChild(link);
           link.click();
           document.body.removeChild(link);
           toast({ title: 'Download Started', description: `Downloading watermarked ${watermarkedFilename}...` });
         };
         img.onerror = () => {
           toast({ title: 'Download Failed', description: 'Could not load image for watermarking.', variant: 'destructive' });
         };
         img.src = dataUri;
       } catch (error) {
         console.error("Error watermarking image:", error);
         toast({ title: 'Watermark Error', description: 'Could not apply watermark.', variant: 'destructive' });
         link.href = dataUri;
         link.download = originalFilename;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
       }
     } else {
       link.href = dataUri;
       link.download = originalFilename;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       toast({ title: 'Download Started', description: `Downloading ${originalFilename}... (Watermark not applicable for this file type)` });
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
      className="text-xs text-black gap-1.5 border-amber-500 px-2 py-1"
      style={{ backgroundColor: '#FFCE54' }} // Keep original yellow for pending
    >
      <Hourglass className="h-3 w-3" />
      Pending Sale
    </Badge>
  );


  return (
    <>
    <Card className={cn(
        "flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200 h-full bg-card",
        className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between mb-1">
           <div className="flex items-center mr-2">
             <CategorySpecificIcon className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
             <CardTitle className="text-lg font-semibold capitalize truncate text-foreground">
               {currentTicket.type} Ticket
             </CardTitle>
             {currentTicket.sellerVerified && (
                <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-primary/30 gap-1 text-xs px-1.5 py-0.5 shrink-0">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                </Badge>
             )}
           </div>
           <Badge variant={isSold ? 'destructive' : 'secondary'} className={cn("text-xs whitespace-nowrap flex-shrink-0", (variant === 'manage') ? 'mr-1' : '')}>ID: {currentTicket.id.substring(0, 6)}</Badge>
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
         {!isSold && !actualIsSeller && currentTicket.sellerContactEmail && (
             <div className="flex items-center mt-2 pt-2 border-t border-dashed">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground">Seller:</span>
                <a href={`mailto:${currentTicket.sellerContactEmail}`} className="ml-1 text-xs text-primary hover:underline truncate">
                    {currentTicket.sellerContactEmail}
                </a>
             </div>
         )}
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
                     className="gap-2 bg-[#FF2459] text-white hover:bg-[#FF2459]/90"
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
                 className="gap-2 bg-[#FF2459] text-white hover:bg-[#FF2459]/90"
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
            <AlertDialogAction onClick={redirectToLogin} className="gap-2 bg-[#FF2459] text-white hover:bg-[#FF2459]/90">
              <LogIn className="h-4 w-4" /> Go to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Helper function (if not already defined elsewhere or if you prefer it scoped here)
// const getUniqueById = <T extends { id: string }>(items: T[]): T[] => {
//     const seenIds = new Set<string>();
//     return items.filter(item => {
//         if (!item || typeof item.id === 'undefined') {
//             console.warn("Encountered invalid item object:", item);
//             return false;
//         }
//         if (seenIds.has(item.id)) {
//             return false;
//         }
//         seenIds.add(item.id);
//         return true;
//     });
// };
