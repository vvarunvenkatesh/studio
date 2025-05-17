
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { TicketCard } from '@/components/ticket-card';
import type { Ticket } from '@/services/ticket-marketplace';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, X, TicketIcon as DefaultTicketIcon, Bus, Train, Film, Calendar as CalendarIconLucide, ListFilter, Ticket as TicketCategoryIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Label } from '@/components/ui/label';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { getSimulatedCurrentUserId, getAvailableTickets, deleteTicket as deleteTicketService } from '@/services/ticket-marketplace';
// Removed BottomSlidingTab import

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

const promotionBanners = [
  { id: 1, src: 'https://picsum.photos/1200/350?random=moviepromo', alt: 'Movie Promotion', hint: 'movie poster action', link: '#' },
  { id: 2, src: 'https://picsum.photos/1200/350?random=eventpromo', alt: 'Event Promotion', hint: 'concert stage lights', link: '#' },
  { id: 3, src: 'https://picsum.photos/1200/350?random=sportspromo', alt: 'Sports Promotion', hint: 'sports stadium action', link: '#' },
];

function CategoryPromotionSlider() {
  const [currentBanner, setCurrentBanner] = React.useState(0);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const goToNextBanner = React.useCallback(() => {
    setCurrentBanner((prev) => (prev + 1) % promotionBanners.length);
    resetInterval();
  }, []);

  const goToPreviousBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + promotionBanners.length) % promotionBanners.length);
    resetInterval();
  };

  const goToBannerSlide = (index: number) => {
     setCurrentBanner(index);
     resetInterval();
  };

  const resetInterval = () => {
      if (intervalRef.current) {
         clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(goToNextBanner, 5000);
  }

  React.useEffect(() => {
    resetInterval();
    return () => {
        if (intervalRef.current) {
           clearInterval(intervalRef.current);
        }
    };
  }, [goToNextBanner]);

  return (
    <div className="relative w-full h-52 sm:h-60 md:h-72 lg:h-80 xl:h-96 overflow-hidden shadow-lg group mb-8 rounded-lg">
      {promotionBanners.map((banner, index) => (
        <Link href={banner.link} key={banner.id} passHref>
            <Image
            src={banner.src}
            alt={banner.alt}
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            style={{ objectFit: 'cover' }}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            data-ai-hint={banner.hint}
            priority={index === 0}
            />
        </Link>
      ))}
       <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10"></div>

        <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousBanner}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 md:h-10 md:w-10"
            aria-label="Previous promotion banner"
        >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
        <Button
            variant="ghost"
            size="icon"
            onClick={goToNextBanner}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 md:h-10 md:w-10"
            aria-label="Next promotion banner"
        >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
        </Button>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 p-2">
            {promotionBanners.map((_, index) => (
                <button
                    key={index}
                    onClick={() => goToBannerSlide(index)}
                    className={cn(
                        "rounded-full transition-all duration-300 ease-in-out",
                        index === currentBanner
                            ? 'h-2 w-2 md:h-2.5 md:w-2.5 bg-white'
                            : 'h-1.5 w-1.5 md:h-2 md:w-2 bg-white/50 hover:bg-white/75'
                    )}
                    aria-label={`Go to promotion slide ${index + 1}`}
                />
            ))}
        </div>
    </div>
  );
}


export default function TicketsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  const currentCategory = searchParams.get('category') as Ticket['type'] | 'transport' | 'all' | null;
  const isEventLikeCategory = currentCategory === 'movie' || currentCategory === 'event' || currentCategory === 'sports';


  const [fromCityFilter, setFromCityFilter] = React.useState(searchParams.get('from') || '');
  const [toCityFilter, setToCityFilter] = React.useState(searchParams.get('to') || '');
  const [priceRange, setPriceRange] = React.useState<[number | undefined, number | undefined]>(parsePriceRange(searchParams.get('price')));
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(parseDateRange(searchParams.get('date')));
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [genericSearchTerm, setGenericSearchTerm] = React.useState(searchParams.get('q') || '');
  const [eventLocationFilter, setEventLocationFilter] = React.useState(searchParams.get('location') || '');


  React.useEffect(() => {
    const updateCurrentUserId = () => {
      const id = getSimulatedCurrentUserId();
      setCurrentUserId(id);
    };
    updateCurrentUserId(); // Initial set

    const handleLoginStorageChange = (event: StorageEvent) => {
      if (event.key === 'isLoggedIn' || event.key === 'userId') {
        updateCurrentUserId();
      }
    };
    window.addEventListener('storage', handleLoginStorageChange);
    return () => window.removeEventListener('storage', handleLoginStorageChange);
  }, []);

  const pageTitle = React.useMemo(() => {
    const currentFrom = searchParams.get('from');
    const currentTo = searchParams.get('to');
    const currentSearchTerm = searchParams.get('q');
    const currentEventLocation = searchParams.get('location');

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
      if (isEventLikeCategory && currentEventLocation) {
        title += ` in ${currentEventLocation}`;
      } else if (!isEventLikeCategory) { // Only add from/to for non-event like if eventLocation isn't primary
        if (currentFrom) title += ` from ${currentFrom}`;
        if (currentTo) title += ` to ${currentTo}`;
      }
      return title;
    }
    if (currentFrom || currentTo) {
      let title = `Tickets`;
      if (currentFrom) title += ` from ${currentFrom}`;
      if (currentTo) title += ` to ${currentTo}`;
      return title;
    }
    if (isEventLikeCategory && currentEventLocation) {
      return `Tickets in ${currentEventLocation}`;
    }
    return 'Available Tickets';
  }, [searchParams, currentCategory, isEventLikeCategory]);

  const loadTickets = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams(searchParams.toString());
    const filters: any = {
      category: params.get('category') && params.get('category') !== 'all' ? params.get('category') as Ticket['type'] | 'transport' : undefined,
      searchTerm: params.get('q') || undefined,
      fromCity: params.get('from') || undefined,
      toCity: params.get('to') || undefined,
      location: params.get('location') || undefined,
    };

    const [minPriceState, maxPriceState] = parsePriceRange(params.get('price'));
    if (minPriceState !== undefined) filters.minPrice = minPriceState;
    if (maxPriceState !== undefined) filters.maxPrice = maxPriceState;

    const dateRangeState = parseDateRange(params.get('date'));
    if (dateRangeState?.from) filters.startDate = format(dateRangeState.from, 'yyyy-MM-dd');
    if (dateRangeState?.to) filters.endDate = format(dateRangeState.to, 'yyyy-MM-dd');

    try {
      const fetchedTickets: Ticket[] = await getAvailableTickets(filters);
      setTickets(fetchedTickets);
    } catch (err: any) {
      console.error("Failed to fetch tickets:", err);
      setError(err.message || "Failed to load tickets. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  React.useEffect(() => {
    loadTickets(); // Load tickets on initial render or when searchParams change
    // Listener for when marketplaceTickets in localStorage changes
    const handleMarketplaceStorageChange = (event: StorageEvent) => {
      if (event.key === 'marketplaceTickets') {
        loadTickets(); // Reload tickets if marketplaceTickets itself changes
      }
    };
    window.addEventListener('storage', handleMarketplaceStorageChange);
    return () => {
      window.removeEventListener('storage', handleMarketplaceStorageChange);
    };
  }, [loadTickets]); // loadTickets is stable due to useCallback and its dependencies

  const handlePurchaseSuccess = (purchasedTicketId: string) => {
    toast({
        title: "Ticket Status Updated",
        description: "The ticket list has been refreshed.",
    });
    // No need to manually call loadTickets here, storage event listener will handle it
  };

  const handleCancelListing = async (ticketId: string) => {
    setIsDeleting(ticketId);
    try {
      const result = await deleteTicketService(ticketId);
      if (result.success) {
        toast({
          title: 'Listing Cancelled',
          description: result.message || 'Your ticket listing has been removed.',
        });
         // No need to manually call loadTickets here, storage event listener will handle it
      } else {
        throw new Error(result.message || 'Could not cancel the ticket listing.');
      }
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
    const query = new URLSearchParams(); // Start fresh

    const currentCat = searchParams.get('category');
    if (currentCat) query.set('category', currentCat);

    if (genericSearchTerm) query.set('q', genericSearchTerm);

    if (isEventLikeCategory) {
      if (eventLocationFilter) query.set('location', eventLocationFilter);
    } else {
      if (fromCityFilter) query.set('from', fromCityFilter);
      if (toCityFilter) query.set('to', toCityFilter);
      const [minPrice, maxPrice] = priceRange;
      if (minPrice !== undefined || maxPrice !== undefined) {
          const priceParts = [];
          if (minPrice !== undefined) priceParts.push(String(minPrice)); else priceParts.push('');
          if (maxPrice !== undefined) priceParts.push(String(maxPrice));
          if (priceParts.length > 0 && (priceParts[0] !== '' || priceParts.length > 1)) {
            query.set('price', priceParts.join('-'));
          }
      }
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
    setGenericSearchTerm('');
    setEventLocationFilter('');
    const category = searchParams.get('category');
    const query = new URLSearchParams();
    if (category) query.set('category', category);
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

  const hasActiveFilters = genericSearchTerm || fromCityFilter || toCityFilter || eventLocationFilter || priceRange[0] !== undefined || priceRange[1] !== undefined || dateRange?.from;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-32 md:pb-16">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground text-center">{pageTitle}</h1>

        {isEventLikeCategory && <CategoryPromotionSlider />}

        <Card className="mb-8 p-4 md:p-6 bg-muted/30 border border-dashed max-w-5xl mx-auto">
          <div className={cn(
              isEventLikeCategory
                ? "flex flex-col md:flex-row md:items-end gap-4" // For movie/event/sports: horizontal on md+
                : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end gap-4" // For train/bus/all: grid layout
          )}>
            {/* Generic Search Term Input */}
            <div className={cn(
                "w-full",
                isEventLikeCategory ? "md:flex-1" : "lg:col-span-2"
            )}>
              <Label htmlFor="genericSearchFilter" className="block text-sm font-medium text-muted-foreground mb-1">Search Term</Label>
              <Input
                id="genericSearchFilter"
                type="text"
                placeholder={isEventLikeCategory ? "Event, movie, sports keyword..." : "Event, movie, city, type..."}
                value={genericSearchTerm}
                onChange={(e) => setGenericSearchTerm(e.target.value)}
                className="bg-background text-foreground"
              />
            </div>

            {/* Conditional Filters based on category */}
            {isEventLikeCategory ? (
              <>
                {/* Event-specific Location Filter */}
                <div className="w-full md:flex-1">
                  <Label htmlFor="eventLocationFilter" className="block text-sm font-medium text-muted-foreground mb-1">Location (City/Venue)</Label>
                  <Input
                    id="eventLocationFilter"
                    type="text"
                    placeholder="Enter city or venue"
                    value={eventLocationFilter}
                    onChange={(e) => setEventLocationFilter(e.target.value)}
                    className="bg-background text-foreground"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Transport/All Specific Filters */}
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
              </>
            )}

            {/* Date Range Picker (Common to all) */}
            <div className={cn(
                "w-full",
                isEventLikeCategory ? "md:w-auto" : ""
            )}>
                <Label htmlFor="dateRangeFilter" className="block text-sm font-medium text-muted-foreground mb-1">Date Range</Label>
                <DateRangePicker
                    id="dateRangeFilter"
                    date={dateRange}
                    onDateChange={setDateRange}
                    className="bg-background text-foreground [&>button]:text-foreground"
                    onDateSelect={() => {}}
                 />
             </div>

            {/* Filter Buttons (Common to all) */}
            <div className={cn(
                "flex flex-col sm:flex-row gap-2 w-full pt-2",
                 isEventLikeCategory ? "md:w-auto" : "lg:col-span-4 lg:justify-end"
            )}>
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
                className="ml-0 md:ml-0"
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
      {/* BottomSlidingTab component removed */}
    </div>
  );
}
