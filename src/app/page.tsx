
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bus, Train, Film, Calendar as CalendarIconLucide, Search, Ticket as TicketCategoryIcon, ChevronLeft, ChevronRight } from 'lucide-react'; // Added TicketCategoryIcon alias
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

// Simple Advertisement Slider Component
const advertisements = [
  { id: 1, src: 'https://picsum.photos/1200/448?random=1', alt: 'concert', hint: 'concert crowd music' },
  { id: 2, src: 'https://picsum.photos/1200/448?random=2', alt: 'train travel', hint: 'train window journey' },
  { id: 3, src: 'https://picsum.photos/1200/448?random=3', alt: 'movie theatre', hint: 'movie theater screen' },
  { id: 4, src: 'https://picsum.photos/1200/448?random=4', alt: 'bus travel', hint: 'bus road trip' },
  { id: 5, src: 'https://picsum.photos/1200/448?random=5', alt: 'sports event', hint: 'stadium sports crowd' },
];

function AdvertisementSlider() {
  const [currentAd, setCurrentAd] = React.useState(0);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const goToNext = React.useCallback(() => {
    setCurrentAd((prev) => (prev + 1) % advertisements.length);
    resetInterval();
  }, []);

  const goToPrevious = () => {
    setCurrentAd((prev) => (prev - 1 + advertisements.length) % advertisements.length);
    resetInterval();
  };

  const goToSlide = (index: number) => {
     setCurrentAd(index);
     resetInterval();
  };

  const resetInterval = () => {
      if (intervalRef.current) {
         clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(goToNext, 5000); // Restart interval
  }

  React.useEffect(() => {
    resetInterval(); // Start the interval on mount
    return () => {
        if (intervalRef.current) {
           clearInterval(intervalRef.current); // Clear interval on unmount
        }
    };
  }, [goToNext]);

  return (
    <div className="relative w-full h-72 md:h-96 lg:h-[28rem] overflow-hidden shadow-lg group">
      {advertisements.map((ad, index) => (
        <Image
          key={ad.id}
          src={ad.src}
          alt={ad.alt}
          fill
          sizes="(max-width: 768px) 100vw, 1200px"
          style={{ objectFit: 'cover' }}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentAd ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          data-ai-hint={ad.hint}
          priority={index === 0}
        />
      ))}
       <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
       <div className="absolute bottom-4 left-4 text-white text-lg md:text-xl lg:text-2xl font-semibold z-20 p-4">
          Last Minute Deals..!
       </div>

        <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 md:h-10 md:w-10"
            aria-label="Previous slide"
        >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
        <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 md:h-10 md:w-10"
            aria-label="Next slide"
        >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
        </Button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 p-2">
            {advertisements.map((_, index) => (
                <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={cn(
                        "rounded-full transition-all duration-300 ease-in-out",
                        index === currentAd
                            ? 'h-2.5 w-2.5 bg-white'
                            : 'h-2 w-2 bg-white/50 hover:bg-white/75'
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                />
            ))}
        </div>
    </div>
  );
}

// Category Icon Component
interface CategoryIconProps {
  icon: React.ElementType;
  label: string;
  href: string;
}

function CategoryIcon({ icon: Icon, label, href }: CategoryIconProps) {
  return (
    <Link href={href} passHref>
      <Card className="text-center p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center justify-center aspect-square bg-card hover:bg-card/90">
        <Icon className="h-10 w-10 md:h-12 md:w-12 text-[#9CAF88] mb-2" />
        <span className="text-sm md:text-base font-medium text-foreground">{label}</span>
      </Card>
    </Link>
  );
}

// Search Form Component
function SearchForm() {
  const router = useRouter();
  const [fromCity, setFromCity] = React.useState('');
  const [toCity, setToCity] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (fromCity) query.set('from', fromCity);
    if (toCity) query.set('to', toCity);
    query.set('category', 'transport');
    router.push(`/tickets?${query.toString()}`);
  };

  return (
    <Card className="p-4 md:p-6 mb-8 md:mb-12 bg-muted/30 border border-dashed max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-center text-foreground">Search for Train or Bus Tickets</h2>
       <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full sm:w-auto">
            <Label htmlFor="fromCity" className="sr-only">From City</Label>
            <Input
                id="fromCity"
                type="text"
                placeholder="From City"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                className="bg-background text-foreground"
            />
        </div>
         <div className="flex-1 w-full sm:w-auto">
            <Label htmlFor="toCity" className="sr-only">To City</Label>
            <Input
                id="toCity"
                type="text"
                placeholder="To City"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                className="bg-background text-foreground"
            />
         </div>
        <Button type="submit" className="w-full sm:w-auto gap-2">
          <Search className="mr-2 h-4 w-4" /> Search
        </Button>
       </form>
    </Card>
  );
}

// Bottom Advertisement Card Component
interface BottomAdCardProps {
  src: string;
  alt: string;
  title: string;
  description: string;
  href: string;
  hint: string;
}

function BottomAdCard({ src, alt, title, description, href, hint }: BottomAdCardProps) {
  return (
    <Link href={href} passHref>
      <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer h-full flex flex-col bg-card">
        <div className="relative h-40 w-full">
          <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} data-ai-hint={hint} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"/>
        </div>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-lg text-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <CardDescription className="text-muted-foreground">{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}


export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
       <Header />

       <AdvertisementSlider />

       <main className="flex-1 container mx-auto px-4 py-6 md:py-10">

         <div className="mt-8 md:mt-12">
             <SearchForm />

             <h2 className="text-2xl font-bold mb-6 text-center text-foreground">Browse by Category</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 mb-12 md:mb-16 mx-auto">
                <CategoryIcon icon={Train} label="Train Tickets" href="/tickets?category=train" />
                <CategoryIcon icon={Bus} label="Bus Tickets" href="/tickets?category=bus" />
                <CategoryIcon icon={Film} label="Movie Tickets" href="/tickets?category=movie" />
                <CategoryIcon icon={CalendarIconLucide} label="Event Tickets" href="/tickets?category=event" />
                <CategoryIcon icon={TicketCategoryIcon} label="Sports Tickets" href="/tickets?category=sports" />
             </div>

              <div className="mx-auto">
                 <h2 className="text-2xl font-bold mb-6 text-center text-foreground">Featured Offers</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    <BottomAdCard
                        src="https://picsum.photos/400/300?random=10"
                        alt="Travel Deal"
                        title="Weekend Getaway Special"
                        description="Save up to 20% on last-minute train tickets this weekend."
                        href="/tickets?category=train"
                        hint="train travel discount"
                    />
                     <BottomAdCard
                        src="https://picsum.photos/400/300?random=11"
                        alt="Event Promotion"
                        title="Hot Event Tickets Available"
                        description="Don't miss the biggest concerts and sports events. Find tickets now!"
                        href="/tickets?category=event"
                        hint="concert event tickets"
                    />
                     <BottomAdCard
                        src="https://picsum.photos/400/300?random=12"
                        alt="Movie Night Offer"
                        title="Movie Buffs Rejoice!"
                        description="Grab cheap movie tickets for tonight's blockbusters."
                        href="/tickets?category=movie"
                        hint="movie cinema tickets"
                     />
                 </div>
              </div>
         </div>
      </main>
    </div>
  );
}
