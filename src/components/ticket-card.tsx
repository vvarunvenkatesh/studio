
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
import { purchaseTicket as purchaseTicketService } from '@/services/ticket-marketplace';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
    isSeller: propIsSeller
}: TicketCardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsHook = useNextSearchParams();

  const [isClientLoggedIn, setIsClientLoggedIn] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = React.useState(false);
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const [detailsVisible, setDetailsVisible] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setIsClientLoggedIn(!!user);
        setCurrentUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  const formattedDate = format(new Date(ticketProp.date.toDate()), 'PPP');
  const CategorySpecificIcon = categoryIconMap[ticketProp.type] || TicketIconLucide;

  const isTicketSold = ticketProp.status === 'sold';
  const actualIsSeller = !!currentUserId && ticketProp.sellerId === currentUserId;

  const cardTitle = (ticketProp.type === 'movie' || ticketProp.type === 'event' || ticketProp.type === 'sports') && ticketProp.title
    ? ticketProp.title
    : `${ticketProp.type.charAt(0).toUpperCase() + ticketProp.type.slice(1)} Ticket`;


  const redirectToLogin = () => {
    let currentRedirectPath = pathname;
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
    if (isTicketSold || actualIsSeller) return;

    setIsPurchasing(true);
    try {
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
        contactMessage += " to arrange ticket transfer.";

        toast({
          title: 'Purchase Initiated!',
          description: contactMessage,
          variant: 'success',
          duration: 7000,
        });
        if (onPurchaseSuccess) {
          onPurchaseSuccess(result.ticket.id);
        }
      } else {
        toast({
          title: 'Purchase Failed',
          description: result.message || 'Could not initiate purchase for the ticket.',
          variant: 'destructive',
        });
        if (result.ticket && result.message?.includes('already sold')) {
           if (onPurchaseSuccess) {
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
       toast({ title: 'Download Started', description: `Downloading ${originalFilename}... (Watermark not applicable)` });
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
          ticketProp.originalTicketDataUri && (actualIsSeller || ticketProp.buyerId === currentUserId) ? (
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
        ) : variant === 'manage' ? (
          renderCancelButton()
        ) : actualIsSeller ? (
          renderPendingIndicator()
        ) : !detailsVisible ? (
          <Button
            size="sm"
            onClick={() => setDetailsVisible(true)}
            aria-label="Get ticket details"
            className="gap-2 bg-[#FF2459] text-white hover:bg-[#FF2459]/90"
          >
            <Info className="mr-2 h-4 w-4" />
            Get Details
          </Button>
        ) : (
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
