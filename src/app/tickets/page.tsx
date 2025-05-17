
'use client';

import * as React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { TicketCard } from '@/components/ticket-card';
import type { Ticket } from '@/services/ticket-marketplace';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, X, TicketIcon as DefaultTicketIcon, Bus, Train, Film, Calendar as CalendarIconLucide, ListFilter, Ticket as TicketCategoryIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Label } from '@/components/ui/label';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { getSimulatedCurrentUserId, getAvailableTickets } from '@/services/ticket-marketplace';
import { BottomSlidingTab } from '@/components/ui/bottom-sliding-tab';

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
  const [genericSearchTerm, setGenericSearchTerm] = React.useState(searchParams.get('q') || '');


  React.useEffect(() => {
    const updateUserId = () => setCurrentUserId(getSimulatedCurrentUserId());
    updateUserId(); // Initial set

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'isLoggedIn' || event.key === 'userId') {
        updateUserId();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  const pageTitle = React.useMemo(() => {
    const currentCategory = searchParams.get('category');
    const currentFrom = searchParams.get('from');
    const currentTo = searchParams.get('to');
    const currentSearchTerm = searchParams.get('q');

    if (currentSearchTerm) {
        return `Results for "${currentSearchTerm}"`;
    }
    if (currentCategory === 'transport') {
        let title = "Train & Bus Tickets";
        if (currentFrom) title += ` from ${currentFrom}`;
        if (currentTo) title += ` to ${currentTo}`;
        return title;
    }
    if (currentCategory && categoryMap[currentCategory as Ticket['type']]) {
      let title = `${categoryMap[currentCategory as Ticket['type']].name} Tickets`;
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
    
    const filters: any = {};
    const currentCategory = searchParams.get('category') as Ticket['type'] | 'transport' | 'all' | null;
    const currentFrom = searchParams.get('from');
    const currentTo = searchParams.get('to');
    const currentPrice = searchParams.get('price');
    const currentDate = searchParams.get('date');
    const currentSearchTerm = searchParams.get('q');

    if (currentCategory && currentCategory !== 'all' && currentCategory !== 'transport') filters.category = currentCategory;
    if (currentCategory === 'transport') filters.category = 'transport';


    if (currentFrom) {
      filters.fromCity = currentFrom;
      setFromCityFilter(currentFrom);
    } else {
      setFromCityFilter('');
    }
    if (currentTo) {
      filters.toCity = currentTo;
      setToCityFilter(currentTo);
    } else {
      setToCityFilter('');
    }

    const [minPriceState, maxPriceState] = parsePriceRange(currentPrice);
    setPriceRange([minPriceState, maxPriceState]);
    if (minPriceState !== undefined) filters.minPrice = minPriceState;
    if (maxPriceState !== undefined) filters.maxPrice = maxPriceState;

    const dateRangeState = parseDateRange(currentDate);
    setDateRange(dateRangeState);
    if (dateRangeState?.from) filters.startDate = format(dateRangeState.from, 'yyyy-MM-dd');
    if (dateRangeState?.to) filters.endDate = format(dateRangeState.to, 'yyyy-MM-dd');
    
    if (currentSearchTerm) {
        filters.searchTerm = currentSearchTerm;
        setGenericSearchTerm(currentSearchTerm);
    } else {
        setGenericSearchTerm('');
    }

    try {
      const fetchedTickets: Ticket[] = await getAvailableTickets(filters);
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
    const query = new URLSearchParams(searchParams.toString()); // Preserve existing params

    if (genericSearchTerm) query.set('q', genericSearchTerm); 
    else query.delete('q');

    if (fromCityFilter) query.set('from', fromCityFilter);
    else query.delete('from');

    if (toCityFilter) query.set('to', toCityFilter);
    else query.delete('to');
    

    const [minPrice, maxPrice] = priceRange;
    if (minPrice !== undefined || maxPrice !== undefined) {
        const priceParts = [];
        if (minPrice !== undefined) priceParts.push(String(minPrice)); else priceParts.push(''); 
        if (maxPrice !== undefined) priceParts.push(String(maxPrice));
        if (priceParts.length > 0 && (priceParts[0] !== '' || priceParts.length > 1)) { 
          query.set('price', priceParts.join('-'));
        } else {
            query.delete('price');
        }
    } else {
        query.delete('price');
    }

    if (dateRange?.from) {
        const fromStr = format(dateRange.from, 'yyyy-MM-dd');
        const toStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
        query.set('date', `${fromStr}_${toStr}`);
    } else {
        query.delete('date');
    }
    router.push(`${pathname}?${query.toString()}`);
  };

  const clearFilters = () => {
    setFromCityFilter('');
    setToCityFilter('');
    setPriceRange([undefined, undefined]);
    setDateRange(undefined);
    setGenericSearchTerm(''); 
    const category = searchParams.get('category');
    const query = new URLSearchParams();
    if (category && category !== 'transport' && category !== 'all') query.set('category', category); 
    else if (category === 'transport') query.set('category', 'transport'); 
    router.push(`${pathname}?${query.toString()}`);
  };

  const renderSkeletons = () => (
    Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="flex flex-col space-y-3">
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

  const hasActiveFilters = fromCityFilter || toCityFilter || priceRange[0] !== undefined || priceRange[1] !== undefined || dateRange?.from || genericSearchTerm;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-32 md:pb-16">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground text-center">{pageTitle}</h1>

        <Card className="mb-8 p-4 md:p-6 bg-muted/30 border border-dashed max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="w-full lg:col-span-2">
              <Label htmlFor="genericSearchFilter" className="block text-sm font-medium text-muted-foreground mb-1">Search Term</Label>
              <Input
                id="genericSearchFilter"
                type="text"
                placeholder="Event, city, type..."
                value={genericSearchTerm}
                onChange={(e) => setGenericSearchTerm(e.target.value)}
                className="bg-background text-foreground"
              />
            </div>
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
             <div className="w-full lg:col-span-2">
                <Label htmlFor="dateRangeFilter" className="block text-sm font-medium text-muted-foreground mb-1">Date Range</Label>
                <DateRangePicker
                    id="dateRangeFilter"
                    date={dateRange}
                    onDateChange={setDateRange}
                    className="bg-background text-foreground [&>button]:text-foreground"
                    onDateSelect={() => {}} 
                 />
             </div>
             <div className="w-full lg:col-span-2">
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
                <Button onClick={handleFilterChange} className="w-full sm:w-auto gap-2 bg-[#FF2459] text-white hover:bg-[#FF2459]/90">
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
                variant="browse"
                onPurchaseSuccess={handlePurchaseSuccess}
                isSeller={!!currentUserId && ticket.sellerId === currentUserId && currentUserId !== 'anonymousUser'}
                onCancelListing={handleCancelListing}
                isCancelling={isDeleting === ticket.id}
                className="ml-0 md:ml-2.5" 
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
       <BottomSlidingTab triggerLabel="Filters & Sort" title="Advanced Options">
        <div className="space-y-4">
          <p className="text-muted-foreground">More filtering and sorting options can be added here.</p>
          <div>
            <h3 className="font-semibold mb-2 text-foreground">Sort by</h3>
            <Button variant="outline" className="w-full mb-2 justify-start">Price: Low to High</Button>
            <Button variant="outline" className="w-full mb-2 justify-start">Price: High to Low</Button>
            <Button variant="outline" className="w-full justify-start">Date: Newest First</Button>
          </div>
        </div>
      </BottomSlidingTab>
    </div>
  );
}
