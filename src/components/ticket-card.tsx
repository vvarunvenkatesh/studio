
'use client';

import * as React from 'react';
import type { Ticket } from '@/services/ticket-marketplace';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Clock, Ticket as TicketIconLucide, IndianRupeeIcon, ShoppingCart, Loader2, ArrowRight, Bus, Train, Film, Calendar as CalendarIconLucideElement, Ticket as TicketCategoryIcon, Download, XCircle, Hourglass, LogIn, Mail, Phone, Info, CheckCircle2 } from 'lucide-react'; // Added CheckCircle2
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter, usePathname, useSearchParams as useNextSearchParams } from 'next/navigation';
import { getSimulatedCurrentUserId, purchaseTicket as purchaseTicketService } from '@/services/ticket-marketplace';

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
    ticket: ticketProp,
    variant = 'browse',
    onPurchaseSuccess,
    onCancelListing,
    isCancelling,
    className,
    isSeller: propIsSeller // Renamed to avoid conflict with internal isSeller state
}: TicketCardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsHook = useNextSearchParams();

  const [isClientLoggedIn, setIsClientLoggedIn] = React.useState(false);
  const [showLoginDialog, setShowLoginDialog] = React.useState(false);
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const [cardInternalCurrentUserId, setCardInternalCurrentUserId] = React.useState<string | null>(null);
  const [detailsVisible, setDetailsVisible] = React.useState(false);


  React.useEffect(() => {
      const updateLoginStatus = () => {
        if (typeof window !== 'undefined') {
            const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
            setIsClientLoggedIn(loggedInStatus);
            setCardInternalCurrentUserId(getSimulatedCurrentUserId());
        }
      }
      updateLoginStatus(); // Initial check

      // Listen for storage changes to update login status dynamically
      const handleStorageChange = (event: StorageEvent) => {
          if (event.key === 'isLoggedIn' || event.key === 'userId') {
              updateLoginStatus();
          }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => {
          window.removeEventListener('storage', handleStorageChange);
      };
  }, []);

  const formattedDate = format(new Date(ticketProp.date), 'PPP');
  const CategorySpecificIcon = categoryIconMap[ticketProp.type] || TicketIconLucide;

  const isTicketSold = ticketProp.status === 'sold';
  // This determines if the current logged-in user (from card's perspective) is the seller of THIS ticket
  const actualIsSeller = !!cardInternalCurrentUserId && ticketProp.sellerId === cardInternalCurrentUserId && cardInternalCurrentUserId !== 'anonymousUser';

  const cardTitle = (ticketProp.type === 'movie' || ticketProp.type === 'event' || ticketProp.type === 'sports') && ticketProp.title
    ? ticketProp.title
    : `${ticketProp.type.charAt(0).toUpperCase() + ticketProp.type.slice(1)} Ticket`;


  const redirectToLogin = () => {
    let currentRedirectPath = pathname;
    // For ticket browse pages, preserve search params
    if (pathname.startsWith('/tickets')) {
        currentRedirectPath += '?' + searchParamsHook.toString();
    }
    router.push(`/login?redirect=${encodeURIComponent(currentRedirectPath)}`);
  };


  const handlePurchase = async () => {
    if (!isClientLoggedIn) {
        setShowLoginDialog(true);
        return;
    }
    // Use 'actualIsSeller' for the check to prevent buying own ticket
    if (isTicketSold || actualIsSeller) return;

    setIsPurchasing(true);
    try {
      // Directly call the service function
      const result = await purchaseTicketService(ticketProp.id);

      if (result.success && result.ticket) {
        let contactMessage = "Contact the seller ";
        if (result.ticket.sellerContactEmail && result.ticket.sellerContactPhone) {
            contactMessage += `at ${result.ticket.sellerContactEmail} or by phone at ${result.ticket.sellerContactPhone}`;
        } else if (result.ticket.sellerContactEmail) {
            contactMessage += `at ${result.ticket.sellerContactEmail}`;
        } else if (result.ticket.sellerContactPhone) {
            contactMessage += `by phone at ${result.ticket.sellerContactPhone}`;
        } else {
            contactMessage += "using their listed contact details";
        }
        contactMessage += " to complete your purchase.";

        toast({
          title: 'Purchase Initiated!',
          description: contactMessage,
          variant: 'success',
          duration: 7000, // Increased duration for contact details
        });
        if (onPurchaseSuccess) {
          onPurchaseSuccess(result.ticket.id); // Propagate success to parent for potential re-fetch
        }
        // UI updates (like marking card as sold) will happen when parent re-renders with new ticket data
      } else {
        toast({
          title: 'Purchase Failed',
          description: result.message || 'Could not initiate purchase for the ticket.',
          variant: 'destructive',
        });
        // If API indicates already sold, parent should refresh to reflect this
        if (result.ticket && result.message?.includes('already sold')) {
           if (onPurchaseSuccess) { // Notify parent to refresh
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
     let fileExtension = 'file'; // Default extension
     const mimeMatch = dataUri.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
     let isImage = false;
     let mimeType = '';
   
     if (mimeMatch && mimeMatch[1]) {
       mimeType = mimeMatch[1];
       const extensionMap: Record<string, string> = {
         'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
         'application/pdf': 'pdf', 'application/msword': 'doc',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
         // Add more mime types and extensions as needed
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
             // Fallback to downloading original if canvas fails
             link.href = dataUri;
             link.download = originalFilename; // Download original if watermarking fails
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
             return;
           }
   
           // Draw original image
           ctx.drawImage(img, 0, 0);
           
           // Add watermark text
           // Adjust font size based on image dimensions for better visibility
           const fontSize = Math.max(12, Math.min(img.width / 20, img.height / 15));
           ctx.font = `bold ${fontSize}px Arial`;
           ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // Semi-transparent black
           ctx.textAlign = 'center';
           ctx.textBaseline = 'middle';
           
           const watermarkText = `Sold via LastMiniT - ID: ${ticketId.substring(0,8)}`; // Example watermark
           // Position watermark (e.g., center)
           const x = canvas.width / 2;
           const y = canvas.height / 2;
           
           ctx.fillText(watermarkText, x, y);
           // You can add more complex watermarking like diagonal text or patterns

           link.href = canvas.toDataURL(mimeType); // Use original mimeType for canvas export
           link.download = watermarkedFilename;
           document.body.appendChild(link);
           link.click();
           document.body.removeChild(link);
           toast({ title: 'Download Started', description: `Downloading watermarked ${watermarkedFilename}...` });
         };
         img.onerror = () => {
           toast({ title: 'Download Failed', description: 'Could not load image for watermarking.', variant: 'destructive' });
         };
         img.src = dataUri; // This triggers the img.onload or img.onerror
       } catch (error) {
         console.error("Error watermarking image:", error);
         toast({ title: 'Watermark Error', description: 'Could not apply watermark.', variant: 'destructive' });
         // Fallback to downloading original
         link.href = dataUri;
         link.download = originalFilename;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
       }
     } else {
       // For non-image files, download directly without watermarking attempt
       link.href = dataUri;
       link.download = originalFilename; // Use original filename
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
                <AlertDialogAction onClick={() => onCancelListing?.(ticketProp.id)} className={cn(buttonVariants({ variant: "destructive" }))}>
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
      style={{ backgroundColor: '#FFCE54' }} // Amber-like color for pending
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
               {cardTitle}
             </CardTitle>
             {ticketProp.sellerVerified && (
                <CheckCircle2 className="ml-2 h-4 w-4 text-green-500 flex-shrink-0" title="Verified Seller" />
             )}
           </div>
           <Badge variant={isTicketSold ? 'destructive' : 'secondary'} className={cn("text-xs whitespace-nowrap flex-shrink-0", (variant === 'manage') ? 'mr-1' : '')}>ID: {ticketProp.id.substring(0, 6)}</Badge>
        </div>
         <CardDescription className="text-sm text-muted-foreground line-clamp-2 h-10">
             {ticketProp.description}
         </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1.5 text-sm pt-2 flex-grow text-foreground">
         {(ticketProp.type === 'train' || ticketProp.type === 'bus') && ticketProp.fromCity && ticketProp.toCity && (
             <div className="flex items-center font-medium">
                <span className="truncate">{ticketProp.fromCity}</span>
                <ArrowRight className="mx-1 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{ticketProp.toCity}</span>
             </div>
         )}
          {(ticketProp.type === 'event' || ticketProp.type === 'movie' || ticketProp.type === 'sports') && ticketProp.location && (
             <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{ticketProp.location}</span>
             </div>
         )}
         {/* Case for train/bus where only general location (e.g., station name) might be provided */}
         {(ticketProp.type === 'train' || ticketProp.type === 'bus') && ticketProp.location && (!ticketProp.fromCity || !ticketProp.toCity) && (
             <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="mr-1 h-3 w-3 flex-shrink-0" />
                <span className="truncate">{ticketProp.location}</span>
             </div>
          )}
         <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{formattedDate}</span>
         </div>
         <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{ticketProp.time}</span>
         </div>
         {/* Seller Contact Information Section - Now conditional */}
         {detailsVisible && !isTicketSold && !(propIsSeller && variant === 'browse') && (ticketProp.sellerContactEmail || ticketProp.sellerContactPhone) && (
             <div className="mt-2 pt-2 border-t border-dashed space-y-1">
                {ticketProp.sellerContactEmail && (
                    <div className="flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <a href={`mailto:${ticketProp.sellerContactEmail}`} className="text-xs text-primary hover:underline truncate">
                            {ticketProp.sellerContactEmail}
                        </a>
                    </div>
                )}
                {ticketProp.sellerContactPhone && (
                    <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <a href={`tel:${ticketProp.sellerContactPhone}`} className="text-xs text-primary hover:underline truncate">
                            {ticketProp.sellerContactPhone}
                        </a>
                    </div>
                )}
             </div>
         )}
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4 mt-auto">
         <div className="flex items-center font-semibold text-lg text-primary">
             <IndianRupeeIcon className="mr-1 h-5 w-5" />
             {ticketProp.price.toFixed(2)}
         </div>

        {isTicketSold ? (
          ticketProp.originalTicketDataUri ? (
            <Button
              size="sm"
              onClick={() => handleDownload(ticketProp.originalTicketDataUri, ticketProp.id, ticketProp.type)}
              aria-label="Download original ticket"
              className="gap-2 bg-[#FF2459] text-white hover:bg-[#FF2459]/90"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          ) : (
            <Badge variant="destructive">Sold</Badge>
          )
        ) : variant === 'manage' ? ( // On Your Active Listings page (PostTicketPage)
          renderCancelButton()
        ) : propIsSeller ? ( // On browse pages (/tickets) if current user is the seller
          renderPendingIndicator()
        ) : !detailsVisible ? ( // On browse pages, not seller, details not yet visible
          <Button
            size="sm"
            onClick={() => setDetailsVisible(true)}
            aria-label="Get ticket details"
            className="gap-2 bg-[#FF2459] text-white hover:bg-[#FF2459]/90"
          >
            <Info className="mr-2 h-4 w-4" />
            Get Details
          </Button>
        ) : ( // On browse pages, not seller, details are visible
          <Button
            size="sm"
            onClick={handlePurchase}
            disabled={isPurchasing}
            aria-label={`Buy ${ticketProp.title || ticketProp.type} ticket for ₹${ticketProp.price.toFixed(2)}`}
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
