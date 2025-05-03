

'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { TicketCard } from '@/components/ticket-card';
import { getAvailableTickets, type Ticket } from '@/services/ticket-marketplace';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, TicketIcon, Bus, Train, Film, Calendar as CalendarIconLucide, ListFilter, Ticket as TicketCategoryIcon } from 'lucide-react';
import type { Ticket as TicketType } from '@/services/ticket-marketplace';
import { cn } from '@/lib/utils';


// Mapping for category icons and display names
const categoryMap: Record<TicketType['type'], { icon: React.ElementType; name: string }> = {
    bus: { icon: Bus, name: 'Bus' },
    train: { icon: Train, name: 'Train' },
    movie: { icon: Film, name: 'Movie' },
    event: { icon: CalendarIconLucide, name: 'Event' },
    sports: { icon: TicketCategoryIcon, name: 'Sports' },
};

export default function TicketsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const initialCategory = searchParams.get('category') as TicketType['type'] | null;
  const [categoryFilter, setCategoryFilter] = React.useState<TicketType['type'] | 'all'>(initialCategory || 'all');
  const [fromCityFilter, setFromCityFilter] = React.useState(searchParams.get('from') || '');
  const [toCityFilter, setToCityFilter] = React.useState(searchParams.get('to') || '');

  const currentCategory = searchParams.get('category') as TicketType['type'] | null;
  const currentFrom = searchParams.get('from');
  const currentTo = searchParams.get('to');

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


  React.useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const filters: { category?: Ticket['type']; fromCity?: string; toCity?: string } = {};
        const category = searchParams.get('category') as Ticket['type'] | null;
        const fromCity = searchParams.get('from');
        const toCity = searchParams.get('to');

        setCategoryFilter(category || 'all');
        setFromCityFilter(fromCity || '');
        setToCityFilter(toCity || '');

        if (category && category !== 'all') filters.category = category;
        if (fromCity) filters.fromCity = fromCity;
        if (toCity) filters.toCity = toCity;


        const fetchedTickets = await getAvailableTickets(filters);
        setTickets(fetchedTickets);
      } catch (err) {
        console.error("Failed to fetch tickets:", err);
        setError("Failed to load tickets. Please try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [searchParams]);

  // Callback function to handle purchased ticket state update
  const handlePurchaseSuccess = (purchasedTicketId: string, purchasedTicket: Ticket) => {
      // Update the specific ticket in the local state to reflect 'sold' status and potentially the data URI
      setTickets(prevTickets =>
          prevTickets.map(ticket =>
              ticket.id === purchasedTicketId ? { ...ticket, status: 'sold', originalTicketDataUri: purchasedTicket.originalTicketDataUri } : ticket
          )
      );
     // Optionally, you could store the purchased ticket info in local storage or context for the user's "My Orders" page
     console.log("Ticket purchased:", purchasedTicket);
  };


  const handleFilterChange = () => {
      const query = new URLSearchParams();
      if (currentCategory && currentCategory !== 'all') {
        query.set('category', currentCategory);
      }

      if (fromCityFilter) query.set('from', fromCityFilter);
      if (toCityFilter) query.set('to', toCityFilter);
      router.push(`/tickets?${query.toString()}`);
  };

  const clearFilters = () => {
      setCategoryFilter(initialCategory || 'all');
      setFromCityFilter('');
      setToCityFilter('');

      const query = new URLSearchParams();
       if (initialCategory && initialCategory !== 'all') {
         query.set('category', initialCategory);
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

   const hasActiveFilters = (categoryFilter && categoryFilter !== 'all') || fromCityFilter || toCityFilter;


  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground text-center">{pageTitle}</h1>

         <Card className="mb-8 p-4 md:p-6 bg-muted/30 border border-dashed max-w-4xl mx-auto">
           <div className="flex flex-col md:flex-row gap-4 items-end">

                <div className="w-full md:w-auto flex-grow">
                    <label htmlFor="fromCityFilter" className="block text-sm font-medium text-muted-foreground mb-1">From</label>
                    <Input
                        id="fromCityFilter"
                        type="text"
                        placeholder="Departure City"
                        value={fromCityFilter}
                        onChange={(e) => setFromCityFilter(e.target.value)}
                        className="bg-background text-foreground"
                    />
                </div>

                 <div className="w-full md:w-auto flex-grow">
                    <label htmlFor="toCityFilter" className="block text-sm font-medium text-muted-foreground mb-1">To</label>
                    <Input
                        id="toCityFilter"
                        type="text"
                        placeholder="Destination City"
                        value={toCityFilter}
                        onChange={(e) => setToCityFilter(e.target.value)}
                        className="bg-background text-foreground"
                    />
                 </div>

                <Button onClick={handleFilterChange} className="w-full md:w-auto gap-2">
                  <ListFilter className="mr-2 h-4 w-4" /> Apply Filters
                </Button>

                {(fromCityFilter || toCityFilter) && (
                    <Button variant="ghost" onClick={clearFilters} className="w-full md:w-auto text-muted-foreground gap-2">
                        <X className="mr-2 h-4 w-4" /> Clear
                    </Button>
                )}
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
                onPurchaseSuccess={handlePurchaseSuccess}
                className="ml-2.5"
              />
            ))}
          </div>
        ) : !error ? (
          <div className="text-center text-muted-foreground mt-10 border border-dashed rounded-lg p-8">
            <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Tickets Found</h2>
            {(fromCityFilter || toCityFilter) ? (
                 <p>No tickets match your current filters. Try broadening your search!</p>
            ) : (
                 <p>It looks like no tickets are listed currently for {currentCategory && categoryMap[currentCategory] ? categoryMap[currentCategory].name.toLowerCase() : 'this category'}. Check back later!</p>
            )}
            {(fromCityFilter || toCityFilter) && (
                <Button variant="link" onClick={clearFilters}>
                    Clear Filters
                </Button>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
