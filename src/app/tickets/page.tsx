
'use client';

import * as React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { TicketCard } from '@/components/ticket-card';
import type { Ticket } from '@/services/ticket-marketplace'; // Keep type
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card'; // Removed CardContent as it's not directly used here
import { Search, X, TicketIcon as DefaultTicketIcon, Bus, Train, Film, Calendar as CalendarIconLucide, ListFilter, Ticket as TicketCategoryIcon, IndianRupeeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Label } from '@/components/ui/label';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { getSimulatedCurrentUserId } from '@/services/ticket-marketplace'; // Import helper

const categoryMap: Record<Ticket['type'], { icon: React.ElementType; name: string }> = {
    bus: { icon: Bus, name: 'Bus' },
    train: { icon: Train, name: 'Train' },
    movie: { icon: Film, name: 'Movie' },
    event: { icon: CalendarIconLucide, name: 'Event' },
    sports: { icon: TicketCategoryIcon, name: 'Sports' },
};

const parsePriceRange = (priceParam: string | null): [number | undefined, number | undefined] => {
    if (!priceParam) return [undefined, undefined];
    const parts = priceParam.split('-');
    const min = parseInt(parts[0], 10);
    const max = parseInt(parts[1], 10);
    return [isNaN(min) ? undefined : min, isNaN(max) ? undefined : max];
};

const parseDateRange = (dateParam: string | null): DateRange | undefined => {
    if (!dateParam) return undefined;
    const parts = dateParam.split('_');
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
  const pathname = usePathname();
  const { toast } = useToast();
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  const [fromCityFilter, setFromCityFilter] = React.useState(searchParams.get('from') || '');
  const [toCityFilter, setToCityFilter] = React.useState(searchParams.get('to') || '');
  const [priceRange, setPriceRange] = React.useState<[number | undefined, number | undefined]>(parsePriceRange(searchParams.get('price')));
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(parseDateRange(searchParams.get('date')));
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCurrentUserId(getSimulatedCurrentUserId());
  }, []);


  const pageTitle = React.useMemo(() => {
    const currentCategory = searchParams.get('category') as Ticket['type'] | null;
    const currentFrom = searchParams.get('from');
    const currentTo = searchParams.get('to');
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
  }, [searchParams]);

  const loadTickets = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const query = new URLSearchParams(searchParams); // Use current searchParams

    // Set input states based on URL params (already done by their useState initializers)
    // Update query object for API call
    if (query.get('from')) setFromCityFilter(query.get('from')!); else query.delete('from');
    if (query.get('to')) setToCityFilter(query.get('to')!); else query.delete('to');

    const priceParam = query.get('price');
    const [minPriceState, maxPriceState] = parsePriceRange(priceParam);
    setPriceRange([minPriceState, maxPriceState]);
    if (minPriceState !== undefined) query.set('minPrice', String(minPriceState)); else query.delete('minPrice');
    if (maxPriceState !== undefined) query.set('maxPrice', String(maxPriceState)); else query.delete('maxPrice');
    query.delete('price'); // Remove combined price param if individual ones are set

    const dateParam = query.get('date');
    const dateRangeState = parseDateRange(dateParam);
    setDateRange(dateRangeState);
    if (dateRangeState?.from) query.set('startDate', format(dateRangeState.from, 'yyyy-MM-dd')); else query.delete('startDate');
    if (dateRangeState?.to) query.set('endDate', format(dateRangeState.to, 'yyyy-MM-dd')); else query.delete('endDate');
    query.delete('date'); // Remove combined date param

    try {
      const response = await fetch(`/api/tickets?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch tickets');
      }
      const fetchedTickets: Ticket[] = await response.json();
      setTickets(fetchedTickets.filter(ticket => ticket.status === 'available'));
    } catch (err: any) {
      console.error("Failed to fetch tickets:", err);
      setError(err.message || "Failed to load tickets. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  React.useEffect(() => {
    loadTickets();
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'marketplaceTickets' || event.key === 'userPostedTickets' || event.key === 'userOrders') {
        loadTickets();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadTickets]);

  const handlePurchaseSuccess = (purchasedTicketId: string) => {
    setTickets(prevTickets =>
      prevTickets.filter(ticket => ticket.id !== purchasedTicketId)
    );
    // No need to update local ticket status, as it's removed.
    // The My Orders page will fetch independently or via storage event.
  };

  const handleCancelListing = async (ticketId: string) => {
    setIsDeleting(ticketId);
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Could not cancel the ticket listing.');
      }
      toast({
        title: 'Listing Cancelled',
        description: 'Your ticket listing has been removed.',
      });
      setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== ticketId));
    } catch (error: any) {
      console.error('Error cancelling ticket listing:', error);
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while cancelling the listing.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleFilterChange = () => {
    const query = new URLSearchParams(); // Start fresh for clarity

    const category = searchParams.get('category'); // Preserve category
    if (category) query.set('category', category);

    if (fromCityFilter) query.set('from', fromCityFilter);
    if (toCityFilter) query.set('to', toCityFilter);

    const [minPrice, maxPrice] = priceRange;
    if (minPrice !== undefined || maxPrice !== undefined) {
        const priceParts = [];
        if (minPrice !== undefined) priceParts.push(String(minPrice));
        if (maxPrice !== undefined) priceParts.push(String(maxPrice));
        query.set('price', priceParts.join('-'));
    }

    if (dateRange?.from) {
        const fromStr = format(dateRange.from, 'yyyy-MM-dd');
        const toStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
        query.set('date', `${fromStr}_${toStr}`);
    }
    router.push(`${pathname}?${query.toString()}`);
  };

  const clearFilters = () => {
    setFromCityFilter('');
    setToCityFilter('');
    setPriceRange([undefined, undefined]);
    setDateRange(undefined);
    const category = searchParams.get('category');
    const query = new URLSearchParams();
    if (category) query.set('category', category);
    router.push(`${pathname}?${query.toString()}`);
  };

  const renderSkeletons = () => (
    Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="flex flex-col space-y-3 ml-2.5">
        <Skeleton className="h-[125px] w-full rounded-xl bg-muted" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4 bg-muted" />
          <Skeleton className="h-4 w-1/2 bg-muted" />
          <Skeleton className="h-4 w-1/4 bg-muted" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-1/4 bg-muted" />
          <Skeleton className="h-8 w-1/3 bg-muted" />
        </div>
      </div>
    ))
  );

  const hasActiveFilters = fromCityFilter || toCityFilter || priceRange[0] !== undefined || priceRange[1] !== undefined || dateRange?.from;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-16 md:pb-0">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground text-center">{pageTitle}</h1>

        <Card className="mb-8 p-4 md:p-6 bg-muted/30 border border-dashed max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="w-full">
              <Label htmlFor="fromCityFilter" className="block text-sm font-medium text-muted-foreground mb-1">From City</Label>
              <Input
                id="fromCityFilter"
                type="text"
                placeholder="Departure City"
                value={fromCityFilter}
                onChange={(e) => setFromCityFilter(e.target.value)}
                className="bg-background text-foreground"
              />
            </div>
            <div className="w-full">
              <Label htmlFor="toCityFilter" className="block text-sm font-medium text-muted-foreground mb-1">To City</Label>
              <Input
                id="toCityFilter"
                type="text"
                placeholder="Destination City"
                value={toCityFilter}
                onChange={(e) => setToCityFilter(e.target.value)}
                className="bg-background text-foreground"
              />
            </div>
             <div className="w-full">
                <Label htmlFor="dateRangeFilter" className="block text-sm font-medium text-muted-foreground mb-1">Date Range</Label>
                <DateRangePicker
                    id="dateRangeFilter"
                    date={dateRange}
                    onDateChange={setDateRange}
                    className="bg-background text-foreground [&>button]:text-foreground"
                    onDateSelect={() => { /* Now handled by onDateChange and internal state */ }}
                 />
             </div>
             <div className="w-full">
                <Label htmlFor="minPriceFilter" className="block text-sm font-medium text-muted-foreground mb-1">Price Range (₹)</Label>
                <div className="flex items-center gap-2">
                    <Input
                       id="minPriceFilter"
                       type="number"
                       placeholder="Min"
                       value={priceRange[0] ?? ''}
                       onChange={(e) => setPriceRange([e.target.value ? parseInt(e.target.value) : undefined, priceRange[1]])}
                       className="bg-background text-foreground"
                       min="0"
                     />
                    <span className="text-muted-foreground">-</span>
                     <Input
                       id="maxPriceFilter"
                       type="number"
                       placeholder="Max"
                       value={priceRange[1] ?? ''}
                       onChange={(e) => setPriceRange([priceRange[0], e.target.value ? parseInt(e.target.value) : undefined])}
                       className="bg-background text-foreground"
                       min="0"
                     />
                </div>
             </div>
            <div className="flex flex-col sm:flex-row gap-2 lg:col-span-4 lg:justify-end w-full">
                <Button onClick={handleFilterChange} className="w-full sm:w-auto gap-2">
                    <ListFilter className="mr-2 h-4 w-4" /> Apply Filters
                </Button>
                {hasActiveFilters && (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 md:px-0">
            {renderSkeletons()}
          </div>
        ) : tickets.length > 0 ? (
          <div className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 md:px-0"
          )}>
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                variant="browse"
                onPurchaseSuccess={handlePurchaseSuccess}
                isSeller={!!currentUserId && ticket.sellerId === currentUserId}
                onCancelListing={handleCancelListing}
                isCancelling={isDeleting === ticket.id}
                className="ml-0 md:ml-2.5" // Adjusted margin for mobile
              />
            ))}
          </div>
        ) : !error ? (
          <div className="text-center text-muted-foreground mt-10 border border-dashed rounded-lg p-8 bg-muted/30">
            <DefaultTicketIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">No Tickets Found</h2>
            {(hasActiveFilters) ? (
              <p className="text-muted-foreground">No tickets match your current filters. Try broadening your search!</p>
            ) : (
              <p className="text-muted-foreground">It looks like no tickets are listed currently for this category. Check back later!</p>
            )}
            {hasActiveFilters && (
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
