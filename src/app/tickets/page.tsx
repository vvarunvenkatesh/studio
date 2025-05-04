
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { TicketCard } from '@/components/ticket-card';
import { getAvailableTickets, deleteTicket, type Ticket } from '@/services/ticket-marketplace'; // Import deleteTicket
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, TicketIcon, Bus, Train, Film, Calendar as CalendarIconLucide, ListFilter, Ticket as TicketCategoryIcon, IndianRupeeIcon } from 'lucide-react';
import type { Ticket as TicketType } from '@/services/ticket-marketplace';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { DateRangePicker } from '@/components/ui/date-range-picker'; // Import DateRangePicker
import { Label } from '@/components/ui/label'; // Import Label
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

// Mapping for category icons and display names
const categoryMap: Record<TicketType['type'], { icon: React.ElementType; name: string }> = {
    bus: { icon: Bus, name: 'Bus' },
    train: { icon: Train, name: 'Train' },
    movie: { icon: Film, name: 'Movie' },
    event: { icon: CalendarIconLucide, name: 'Event' },
    sports: { icon: TicketCategoryIcon, name: 'Sports' },
};

// Helper to parse price range from URL
const parsePriceRange = (priceParam: string | null): [number | undefined, number | undefined] => {
    if (!priceParam) return [undefined, undefined];
    const parts = priceParam.split('-');
    const min = parseInt(parts[0], 10);
    const max = parseInt(parts[1], 10);
    return [isNaN(min) ? undefined : min, isNaN(max) ? undefined : max];
};

// Helper to parse date range from URL
const parseDateRange = (dateParam: string | null): DateRange | undefined => {
    if (!dateParam) return undefined;
    const parts = dateParam.split('_'); // Using underscore as separator
    const from = parts[0] ? new Date(parts[0]) : undefined;
    const to = parts[1] ? new Date(parts[1]) : undefined;
    if (from && !isNaN(from.getTime())) {
        return { from, to: (to && !isNaN(to.getTime())) ? to : undefined };
    }
    return undefined;
};

export default function TicketsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast(); // Get toast hook
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null); // Track deleting state

  // Filter state for input fields and pickers
  const [fromCityFilter, setFromCityFilter] = React.useState(searchParams.get('from') || '');
  const [toCityFilter, setToCityFilter] = React.useState(searchParams.get('to') || '');
  const [priceRange, setPriceRange] = React.useState<[number | undefined, number | undefined]>(parsePriceRange(searchParams.get('price')));
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(parseDateRange(searchParams.get('date')));

  const currentCategory = searchParams.get('category') as TicketType['type'] | null;
  const currentFrom = searchParams.get('from');
  const currentTo = searchParams.get('to');
  const currentPrice = searchParams.get('price');
  const currentDate = searchParams.get('date');

  // Simulate current user ID - Replace with actual authentication logic
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  // Get user ID from localStorage (or your auth system)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Simple simulation: Assume 'currentUser' ID if logged in
      const loggedInStatus = localStorage.getItem('isLoggedIn');
      if (loggedInStatus === 'true') {
        setCurrentUserId('currentUser'); // Replace with actual user ID retrieval
      } else {
        setCurrentUserId(null);
      }
    }
  }, []);

  const pageTitle = React.useMemo(() => {
    if (currentCategory && categoryMap[currentCategory]) {
      let title = `${categoryMap[currentCategory].name} Tickets`;
      if (currentFrom) title += ` from ${currentFrom}`;
      if (currentTo) title += ` to ${currentTo}`;
      return title;
    }
    if (currentFrom || currentTo) {
      let title = `Tickets`;
      if (currentFrom) title += ` from ${currentFrom}`;
      if (currentTo) title += ` to ${currentTo}`;
      return title;
    }
    return 'Available Tickets';
  }, [currentCategory, currentFrom, currentTo]);

  const loadTickets = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: {
          category?: Ticket['type'];
          fromCity?: string;
          toCity?: string;
          minPrice?: number;
          maxPrice?: number;
          startDate?: string;
          endDate?: string;
       } = {};
      const category = searchParams.get('category') as Ticket['type'] | null;
      const fromCity = searchParams.get('from');
      const toCity = searchParams.get('to');
      const priceParam = searchParams.get('price');
      const dateParam = searchParams.get('date');

      // Set input states based on URL params
      setFromCityFilter(fromCity || '');
      setToCityFilter(toCity || '');
      const [minPriceState, maxPriceState] = parsePriceRange(priceParam);
      setPriceRange([minPriceState, maxPriceState]);
      const dateRangeState = parseDateRange(dateParam);
      setDateRange(dateRangeState);


      if (category && category !== 'all') filters.category = category;
      if (fromCity) filters.fromCity = fromCity;
      if (toCity) filters.toCity = toCity;
      if (minPriceState !== undefined) filters.minPrice = minPriceState;
      if (maxPriceState !== undefined) filters.maxPrice = maxPriceState;
      if (dateRangeState?.from) filters.startDate = format(dateRangeState.from, 'yyyy-MM-dd');
      if (dateRangeState?.to) filters.endDate = format(dateRangeState.to, 'yyyy-MM-dd');


      const fetchedTickets = await getAvailableTickets(filters); // getAvailableTickets now only returns available ones
      setTickets(fetchedTickets);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setError("Failed to load tickets. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]); // Depend on searchParams

  React.useEffect(() => {
    loadTickets(); // Load initially

    // Listen for storage changes to reload tickets
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'marketplaceTickets' || event.key === 'userPostedTickets') {
        loadTickets(); // Reload if marketplace or user's posted tickets change
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };

  }, [loadTickets]); // Depend on the memoized loadTickets function

  // Callback function to handle purchased ticket state update
  // Updates the ticket status in the current list instead of removing it
  const handlePurchaseSuccess = (purchasedTicketId: string) => {
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === purchasedTicketId ? { ...ticket, status: 'sold' } : ticket
      ).filter(ticket => ticket.status !== 'sold') // Filter out sold tickets after update
    );
    console.log("Ticket purchased and status updated in browse view:", purchasedTicketId);
  };

  // Handle cancelling a ticket listing
  const handleCancelListing = async (ticketId: string) => {
    setIsDeleting(ticketId);
    try {
      const result = await deleteTicket(ticketId);
      if (result.success) {
        toast({
          title: 'Listing Cancelled',
          description: 'Your ticket listing has been removed.',
        });
        // Reload tickets after successful deletion (or filter locally)
        setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== ticketId));
      } else {
        toast({
          title: 'Cancellation Failed',
          description: result.message || 'Could not cancel the ticket listing.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error cancelling ticket listing:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while cancelling the listing.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleFilterChange = () => {
    const query = new URLSearchParams(searchParams); // Use existing params as base

    // Update or remove from/to params
    if (fromCityFilter) query.set('from', fromCityFilter);
    else query.delete('from');

    if (toCityFilter) query.set('to', toCityFilter);
    else query.delete('to');

    // Update or remove price param
    const [minPrice, maxPrice] = priceRange;
    if (minPrice !== undefined || maxPrice !== undefined) {
        query.set('price', `${minPrice ?? ''}-${maxPrice ?? ''}`);
    } else {
        query.delete('price');
    }

    // Update or remove date param
    if (dateRange?.from) {
        const fromStr = format(dateRange.from, 'yyyy-MM-dd');
        const toStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
        query.set('date', `${fromStr}_${toStr}`); // Use underscore separator
    } else {
        query.delete('date');
    }

    // Keep category if it exists
    const category = searchParams.get('category');
    if (category) {
      query.set('category', category);
    } else {
        query.delete('category'); // Remove category if not explicitly set
    }

    router.push(`/tickets?${query.toString()}`);
  };

  const clearFilters = () => {
    setFromCityFilter('');
    setToCityFilter('');
    setPriceRange([undefined, undefined]);
    setDateRange(undefined);

    const query = new URLSearchParams(searchParams);
    query.delete('from');
    query.delete('to');
    query.delete('price');
    query.delete('date');
    // Keep category filter when clearing others
    const category = searchParams.get('category');
    if (category) {
      query.set('category', category);
    } else {
        query.delete('category'); // If no category was present, ensure it's cleared
    }

    router.push(`/tickets?${query.toString()}`);
  };

  const renderSkeletons = () => (
    Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="flex flex-col space-y-3 ml-2.5">
        <Skeleton className="h-[125px] w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-8 w-1/3" />
        </div>
      </div>
    ))
  );

  const hasActiveFilters = fromCityFilter || toCityFilter || priceRange[0] !== undefined || priceRange[1] !== undefined || dateRange?.from;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground text-center">{pageTitle}</h1>

        {/* Centered filter card */}
        <Card className="mb-8 p-4 md:p-6 bg-muted/30 border border-dashed max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

            {/* From City */}
            <div className="w-full">
              <Label htmlFor="fromCityFilter" className="block text-sm font-medium text-muted-foreground mb-1">From City</Label>
              <Input
                id="fromCityFilter"
                type="text"
                placeholder="Departure City"
                value={fromCityFilter}
                onChange={(e) => setFromCityFilter(e.target.value)}
                className="bg-background text-foreground" // Ensure text-foreground
              />
            </div>

            {/* To City */}
            <div className="w-full">
              <Label htmlFor="toCityFilter" className="block text-sm font-medium text-muted-foreground mb-1">To City</Label>
              <Input
                id="toCityFilter"
                type="text"
                placeholder="Destination City"
                value={toCityFilter}
                onChange={(e) => setToCityFilter(e.target.value)}
                className="bg-background text-foreground" // Ensure text-foreground
              />
            </div>

             {/* Date Range */}
             <div className="w-full">
                <Label htmlFor="dateRangeFilter" className="block text-sm font-medium text-muted-foreground mb-1">Date Range</Label>
                <DateRangePicker
                    id="dateRangeFilter"
                    date={dateRange}
                    onDateChange={setDateRange}
                    className="bg-background text-foreground [&>button]:text-foreground" // Adjust styling if needed
                 />
             </div>

             {/* Price Range */}
             <div className="w-full">
                <Label htmlFor="minPriceFilter" className="block text-sm font-medium text-muted-foreground mb-1">Price Range (₹)</Label>
                <div className="flex items-center gap-2">
                    <Input
                       id="minPriceFilter"
                       type="number"
                       placeholder="Min"
                       value={priceRange[0] ?? ''}
                       onChange={(e) => setPriceRange([e.target.value ? parseInt(e.target.value) : undefined, priceRange[1]])}
                       className="bg-background text-foreground" // Ensure text-foreground
                       min="0"
                     />
                    <span className="text-muted-foreground">-</span>
                     <Input
                       id="maxPriceFilter"
                       type="number"
                       placeholder="Max"
                       value={priceRange[1] ?? ''}
                       onChange={(e) => setPriceRange([priceRange[0], e.target.value ? parseInt(e.target.value) : undefined])}
                       className="bg-background text-foreground" // Ensure text-foreground
                       min="0"
                     />
                </div>
             </div>


            {/* Filter Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 lg:col-span-4 lg:justify-end w-full">
                <Button onClick={handleFilterChange} className="w-full sm:w-auto gap-2">
                    <ListFilter className="mr-2 h-4 w-4" /> Apply Filters
                </Button>

                {hasActiveFilters && ( // Show clear only if any filters are active
                    <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto text-muted-foreground gap-2">
                        <X className="mr-2 h-4 w-4" /> Clear Filters
                    </Button>
                )}
            </div>
          </div>
        </Card>

        {error && (
          <div className="text-center text-destructive mt-10">
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {renderSkeletons()}
          </div>
        ) : tickets.length > 0 ? (
          <div className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          )}>
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                variant="browse" // Always browse variant on this page
                onPurchaseSuccess={handlePurchaseSuccess}
                // Determine if the current user is the seller for this ticket
                isSeller={!!currentUserId && ticket.sellerId === currentUserId}
                // Pass the cancel handler function
                onCancelListing={handleCancelListing}
                // Pass the cancelling state for this specific ticket
                isCancelling={isDeleting === ticket.id}
                className="ml-2.5" // Keep existing margin class
              />
            ))}
          </div>
        ) : !error ? (
          <div className="text-center text-muted-foreground mt-10 border border-dashed rounded-lg p-8">
            <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">No Tickets Found</h2>
            {(hasActiveFilters) ? ( // Check if any filters are active (excluding category)
              <p className="text-muted-foreground">No tickets match your current filters. Try broadening your search!</p>
            ) : (
              <p className="text-muted-foreground">It looks like no tickets are listed currently for this category. Check back later!</p>
            )}
            {hasActiveFilters && ( // Only show clear if any filters are active
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear Filters
              </Button>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}


