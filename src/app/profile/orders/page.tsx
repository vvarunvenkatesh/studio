
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Download, Calendar, Clock, MapPin, ArrowRight, Rupee, Bus, Train, Film, Calendar as CalendarIconLucide, Ticket as TicketCategoryIcon, Trash2 } from 'lucide-react'; // Changed DollarSign to Rupee
import type { Ticket } from '@/services/ticket-marketplace';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; // Import AlertDialog components


// Mapping for category icons
const categoryIconMap: Record<Ticket['type'], React.ElementType> = {
  bus: Bus,
  train: Train,
  movie: Film,
  event: CalendarIconLucide,
  sports: TicketCategoryIcon,
};

// Simplified Order Item Component
interface OrderItemProps {
  order: Ticket;
  onDelete: (orderId: string) => void; // Add onDelete prop
}

function OrderItem({ order, onDelete }: OrderItemProps) { // Receive onDelete
  const { toast } = useToast();
  const CategorySpecificIcon = categoryIconMap[order.type] || TicketCategoryIcon;
  const formattedDate = format(new Date(order.date), 'PPP');

   // Function to handle downloading the original ticket (copied from TicketCard, could be extracted)
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

  return (
    <Card className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 bg-card shadow-sm">
       <div className="flex-shrink-0 flex items-center justify-center sm:justify-start mb-2 sm:mb-0">
          <CategorySpecificIcon className="h-8 w-8 text-primary" />
       </div>

       <div className="flex-grow grid gap-1.5 text-sm">
          <div className="flex justify-between items-start">
             <h3 className="font-semibold capitalize">{order.type} Ticket</h3>
             <Badge variant="secondary" className="text-xs whitespace-nowrap">ID: {order.id}</Badge>
          </div>
          <p className="text-muted-foreground text-xs line-clamp-2">{order.description}</p>

          {/* Details Section */}
          <div className="mt-2 space-y-1 text-xs">
             {(order.type === 'train' || order.type === 'bus') && order.fromCity && order.toCity && (
               <div className="flex items-center font-medium">
                 <span className="truncate">{order.fromCity}</span>
                 <ArrowRight className="mx-1 h-3 w-3 text-muted-foreground flex-shrink-0" />
                 <span className="truncate">{order.toCity}</span>
               </div>
             )}
             {(order.type === 'event' || order.type === 'movie' || order.type === 'sports') && order.location && (
               <div className="flex items-center">
                 <MapPin className="mr-1 h-3 w-3 text-muted-foreground flex-shrink-0" />
                 <span className="truncate">{order.location}</span>
               </div>
             )}
              {(order.type === 'train' || order.type === 'bus') && order.location && (!order.fromCity || !order.toCity) && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin className="mr-1 h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{order.location}</span>
                </div>
              )}
             <div className="flex items-center">
               <Calendar className="mr-1 h-3 w-3 text-muted-foreground flex-shrink-0" />
               <span>{formattedDate}</span>
             </div>
             <div className="flex items-center">
               <Clock className="mr-1 h-3 w-3 text-muted-foreground flex-shrink-0" />
               <span>{order.time}</span>
             </div>
          </div>
       </div>

       {/* Price, Download, and Delete */}
       <div className="flex sm:flex-col items-end sm:items-center justify-between sm:justify-start mt-2 sm:mt-0 sm:ml-4 gap-2">
          <div className="flex items-center font-semibold text-lg text-primary">
             <Rupee className="mr-1 h-5 w-5" /> {/* Changed DollarSign to Rupee */}
             {order.price.toFixed(2)}
         </div>
          {order.originalTicketDataUri ? (
             <Button
               size="sm"
               onClick={() => handleDownload(order.originalTicketDataUri, order.id, order.type)}
               aria-label="Download original ticket"
               className="gap-2 mt-0 sm:mt-2" // Adjust margin for layout
             >
               <Download className="mr-2 h-4 w-4" />
               Download
             </Button>
           ) : (
             <Badge variant="outline" className="mt-0 sm:mt-2 text-xs text-muted-foreground">No File</Badge> // Indicate no file
           )}
            {/* Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    aria-label="Delete order"
                    className="gap-2 mt-0 sm:mt-2"
                   >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the order history for this ticket from your browser.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(order.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
       </div>
    </Card>
  );
}

export default function ProfileOrdersPage() {
  const { toast } = useToast(); // Get toast function
  const [orders, setOrders] = React.useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Function to get unique orders based on ID
  const getUniqueOrders = (tickets: Ticket[]): Ticket[] => {
      const seenIds = new Set<string>();
      return tickets.filter(ticket => {
          if (seenIds.has(ticket.id)) {
              return false;
          }
          seenIds.add(ticket.id);
          return true;
      });
  };


  React.useEffect(() => {
    // Load orders from localStorage on mount
    if (typeof window !== 'undefined') {
      try {
        const storedOrdersString = localStorage.getItem('userOrders');
        const storedOrders: Ticket[] = storedOrdersString ? JSON.parse(storedOrdersString) : [];
        setOrders(getUniqueOrders(storedOrders).reverse()); // Ensure uniqueness and show newest orders first
      } catch (e) {
        console.error("Failed to load orders from localStorage:", e);
        // Handle error (e.g., show a message)
      } finally {
        setIsLoading(false);
      }

       // Listen for changes to userOrders in localStorage
       const handleStorageChange = (event: StorageEvent) => {
           if (event.key === 'userOrders' && event.newValue) {
             try {
               const updatedStoredOrders: Ticket[] = JSON.parse(event.newValue);
               setOrders(getUniqueOrders(updatedStoredOrders).reverse()); // Ensure uniqueness on update
             } catch (e) {
               console.error("Failed to parse updated orders:", e);
             }
           } else if (event.key === 'userOrders' && event.newValue === null) {
               setOrders([]); // Clear orders if removed from storage
           }
       };

       window.addEventListener('storage', handleStorageChange);

       // Cleanup listener on unmount
       return () => {
           window.removeEventListener('storage', handleStorageChange);
       };


    } else {
        setIsLoading(false); // Set loading to false if window is not defined
    }
  }, []);

  // Function to handle deleting an order
  const handleDeleteOrder = (orderId: string) => {
    if (typeof window !== 'undefined') {
      try {
        // Filter out the order to delete from the current unique state
        const updatedOrders = orders.filter(order => order.id !== orderId);
        setOrders(updatedOrders); // Update state immediately

        // Update localStorage with the filtered list (reverse it back for storage if needed)
        // Assuming the state `orders` is already reversed for display, reverse it back before saving
        const ordersToSave = [...updatedOrders].reverse();
        localStorage.setItem('userOrders', JSON.stringify(ordersToSave));

        // Dispatch storage event to notify other tabs/windows if necessary
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'userOrders',
          newValue: JSON.stringify(ordersToSave),
          storageArea: localStorage,
        }));

        toast({
          title: 'Order Deleted',
          description: 'The order history has been removed from this browser.',
        });

      } catch (e) {
        console.error("Failed to delete order from localStorage:", e);
        toast({
          title: 'Deletion Failed',
          description: 'Could not remove the order history.',
          variant: 'destructive',
        });
        // Optionally revert state if localStorage update fails
        // This would require storing the original orders before trying to update
        // For simplicity, we're not reverting here. Reloading might fix inconsistency.
      }
    }
  };


  return (
    <Card className="w-full bg-background">
      <CardHeader>
        <CardTitle>My Orders</CardTitle>
        <CardDescription>View your past ticket purchases.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
           // You can add a loading skeleton here
           <div className="text-center text-muted-foreground py-10">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-lg text-center text-muted-foreground bg-muted/30">
             <ShoppingBag className="h-10 w-10 mb-2" />
            <p>You haven't purchased any tickets yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Map over the state which is already guaranteed to be unique */}
            {orders.map((order) => (
              <OrderItem key={order.id} order={order} onDelete={handleDeleteOrder} /> // Pass handleDeleteOrder
            ))}
          </div>
        )}
      </CardContent>
       <CardFooter className="text-xs text-muted-foreground pt-4 border-t">
           Order history is stored locally in your browser. Clearing browser data may remove this history.
       </CardFooter>
    </Card>
  );
}
