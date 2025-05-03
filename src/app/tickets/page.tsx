
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
import { Search, X, TicketIcon, Bus, Train, Film, Calendar as CalendarIconLucide, ListFilter, Ticket as TicketCategoryIcon } from 'lucide-react'; // Added TicketCategoryIcon
import type { Ticket as TicketType } from '@/services/ticket-marketplace'; // Use type alias


// Mapping for category icons and display names
const categoryMap: Record<TicketType['type'], { icon: React.ElementType; name: string }> = {
    bus: { icon: Bus, name: 'Bus' },
    train: { icon: Train, name: 'Train' },
    movie: { icon: Film, name: 'Movie' },
    event: { icon: CalendarIconLucide, name: 'Event' },
    sports: { icon: TicketCategoryIcon, name: 'Sports' }, // Added sports
};

export default function TicketsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // State for filter inputs, initialized from URL params or 'all'
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
    return 'All Available Tickets';
  }, [currentCategory, currentFrom, currentTo]);


  // Fetch tickets based on current URL search params
  React.useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const filters: { category?: Ticket['type']; fromCity?: string; toCity?: string } = {};
        const category = searchParams.get('category') as Ticket['type'] | null; // Get category from URL
        const fromCity = searchParams.get('from');
        const toCity = searchParams.get('to');

        // Use 'all' as default if no category in URL, ensure not empty string
        setCategoryFilter(category || 'all');
        setFromCityFilter(fromCity || '');
        setToCityFilter(toCity || '');

        // Only apply category filter if it's not 'all'
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
  }, [searchParams]); // Re-run effect when searchParams change

  // Callback function to remove purchased ticket from the list
  const handlePurchaseSuccess = (purchasedTicketId: string) => {
    setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== purchasedTicketId));
  };

  // Handle filter changes and update URL
  const handleFilterChange = () => {
      const query = new URLSearchParams();
      // Only add category to URL if it's not 'all'
      if (categoryFilter && categoryFilter !== 'all') query.set('category', categoryFilter);
      if (fromCityFilter) query.set('from', fromCityFilter);
      if (toCityFilter) query.set('to', toCityFilter);
      router.push(`/tickets?${query.toString()}`);
  };

  // Clear all filters and update URL
  const clearFilters = () => {
      // Set local state to defaults
      setCategoryFilter('all');
      setFromCityFilter('');
      setToCityFilter('');
      // Navigate to base tickets page
      router.push('/tickets');
  };


  const renderSkeletons = () => (
    Array.from({ length: 8 }).map((_, index) => ( // Show more skeletons
      <div key={index} className="flex flex-col space-y-3">
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

  // Check if any filter is active (category is not 'all', or cities are set)
  const hasActiveFilters = (categoryFilter && categoryFilter !== 'all') || fromCityFilter || toCityFilter;

  // Ensure value passed to Select is never an empty string, map "" to "all"
  const selectValue = categoryFilter === "" ? "all" : (categoryFilter || 'all');


  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">{pageTitle}</h1>

         {/* Filter Section */}
         <Card className="mb-8 p-4 md:p-6 bg-muted/30 border border-dashed">
           <div className="flex flex-col md:flex-row gap-4 items-end">
                {/* Category Select */}
                <div className="w-full md:w-auto flex-grow md:flex-grow-0 md:min-w-[150px]">
                    <label htmlFor="categoryFilter" className="block text-sm font-medium text-muted-foreground mb-1">Category</label>
                    {/* Use derived selectValue which guarantees it's not "" */}
                    <Select value={selectValue} onValueChange={(value) => setCategoryFilter(value as TicketType['type'] | 'all')}>
                        <SelectTrigger id="categoryFilter">
                            {/* Placeholder text appears when value is 'all' */}
                            <SelectValue placeholder="Any Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {/* Use 'all' as the value for the 'Any Category' option */}
                            <SelectItem value="all">Any Category</SelectItem>
                            <SelectItem value="bus">Bus</SelectItem>
                            <SelectItem value="train">Train</SelectItem>
                            <SelectItem value="movie">Movie</SelectItem>
                            <SelectItem value="event">Event</SelectItem>
                            <SelectItem value="sports">Sports</SelectItem> {/* Added Sports */}
                        </SelectContent>
                    </Select>
                </div>

                {/* From City Input */}
                <div className="w-full md:w-auto flex-grow">
                    <label htmlFor="fromCityFilter" className="block text-sm font-medium text-muted-foreground mb-1">From</label>
                    <Input
                        id="fromCityFilter"
                        type="text"
                        placeholder="Departure City"
                        value={fromCityFilter}
                        onChange={(e) => setFromCityFilter(e.target.value)}
                        className="bg-background"
                    />
                </div>

                {/* To City Input */}
                 <div className="w-full md:w-auto flex-grow">
                    <label htmlFor="toCityFilter" className="block text-sm font-medium text-muted-foreground mb-1">To</label>
                    <Input
                        id="toCityFilter"
                        type="text"
                        placeholder="Destination City"
                        value={toCityFilter}
                        onChange={(e) => setToCityFilter(e.target.value)}
                        className="bg-background"
                    />
                 </div>

                {/* Apply Filter Button */}
                <Button onClick={handleFilterChange} className="w-full md:w-auto gap-2">
                  <ListFilter className="mr-2 h-4 w-4" /> Apply Filters
                </Button>

                {/* Clear Filters Button */}
                {/* Show clear button if any filter is active */}
                {hasActiveFilters && (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onPurchaseSuccess={handlePurchaseSuccess}
              />
            ))}
          </div>
        ) : !error ? (
          <div className="text-center text-muted-foreground mt-10 border border-dashed rounded-lg p-8">
            <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Tickets Found</h2>
            {hasActiveFilters ? (
                 <p>No tickets match your current filters. Try broadening your search!</p>
            ) : (
                 <p>It looks like no tickets are listed currently. Check back later!</p>
            )}
            {/* Show clear filters button only if filters are active */}
            {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters}>
                    Clear Filters
                </Button>
            )}
          </div>
        ) : null}
      </main>
       <footer className="py-4 border-t bg-background mt-10">
         <div className="container text-center text-sm text-muted-foreground">
           © {new Date().getFullYear()} LastminIT tickets. All rights reserved.
         </div>
       </footer>
    </div>
  );
}
