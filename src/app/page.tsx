
'use client';

import * as React from 'react';
import Link from 'next/link';
// Removed unused Header import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bus, Train, Film, Calendar as CalendarIconLucide, Search, TicketIcon as TicketCategoryIcon } from 'lucide-react'; // Renamed Calendar icon
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Simple Advertisement Slider Component (replace with a proper carousel library if needed)
const advertisements = [
  { id: 1, src: 'https://picsum.photos/1200/448?random=1', alt: 'concert', hint: 'concert crowd music' }, // Updated dimensions for new aspect ratio
  { id: 2, src: 'https://picsum.photos/1200/448?random=2', alt: 'train travel', hint: 'train window journey' }, // Updated dimensions
  { id: 3, src: 'https://picsum.photos/1200/448?random=3', alt: 'movie theatre', hint: 'movie theater screen' }, // Updated dimensions
];

function AdvertisementSlider() {
  const [currentAd, setCurrentAd] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % advertisements.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    // Increased height classes: h-72 (small), md:h-96 (medium), lg:h-[28rem] (large - 448px)
    <div className="relative w-full h-72 md:h-96 lg:h-[28rem] overflow-hidden rounded-lg shadow-lg mb-8 md:mb-12">
      {advertisements.map((ad, index) => (
        <Image
          key={ad.id}
          src={ad.src}
          alt={ad.alt}
          layout="fill"
          objectFit="cover"
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentAd ? 'opacity-100' : 'opacity-0'}`}
          data-ai-hint={ad.hint}
          priority={index === 0} // Prioritize loading the first image
        />
      ))}
       <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
       <div className="absolute bottom-4 left-4 text-white text-lg md:text-xl lg:text-2xl font-semibold z-10"> {/* Increased font size slightly */}
          {/* Can add dynamic text based on currentAd if needed */}
          Find Last Minute Deals!
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
      <Card className="text-center p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center justify-center aspect-square bg-card hover:bg-accent/50">
        <Icon className="h-10 w-10 md:h-12 md:w-12 text-primary mb-2" />
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
    // Always navigate, even if empty, to the tickets page, potentially clearing previous searches
    router.push(`/tickets?${query.toString()}`);
  };

  return (
    <Card className="p-4 md:p-6 mb-8 md:mb-12 bg-muted/30 border border-dashed">
        <h2 className="text-xl font-semibold mb-4 text-center text-foreground">Search for Train or Bus Tickets</h2>
       <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full sm:w-auto">
            <label htmlFor="fromCity" className="sr-only">From City</label>
            <Input
                id="fromCity"
                type="text"
                placeholder="From City"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                className="bg-background"
            />
        </div>
         <div className="flex-1 w-full sm:w-auto">
            <label htmlFor="toCity" className="sr-only">To City</label>
            <Input
                id="toCity"
                type="text"
                placeholder="To City"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                className="bg-background"
            />
         </div>
        <Button type="submit" className="w-full sm:w-auto gap-2"> {/* Added gap-2 */}
          <Search className="mr-2 h-4 w-4" /> Search
        </Button>
       </form>
    </Card>
  );
}


export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Restored original header structure */}
       <header className="sticky top-0 z-40 w-full border-b bg-card">
         <div className="container flex h-16 items-center justify-between">
            {/* Profile Icon on the left */}
             <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarImage src="https://picsum.photos/100?a" alt="User Profile" data-ai-hint="profile avatar user" />
                <AvatarFallback>U</AvatarFallback>
             </Avatar>

            {/* Title Centered */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <Link href="/" className="text-2xl font-bold text-card-foreground whitespace-nowrap">
                  LastminIT<span className="text-primary">tickets</span>
                </Link>
            </div>

           {/* Post Ticket Button on the right */}
           <Button asChild variant="default" size="sm">
             <Link href="/post-ticket">
                Post Ticket
             </Link>
           </Button>
         </div>
       </header>

      <main className="flex-1 container py-6 md:py-10">
         {/* Advertisement Wallposter */}
         <AdvertisementSlider />

         {/* Search Form */}
         <SearchForm />

         {/* Category Icons */}
         <h2 className="text-2xl font-bold mb-6 text-center text-foreground">Browse by Category</h2>
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6"> {/* Adjusted grid columns */}
            <CategoryIcon icon={Bus} label="Bus Tickets" href="/tickets?category=bus" />
            <CategoryIcon icon={Train} label="Train Tickets" href="/tickets?category=train" />
            <CategoryIcon icon={Film} label="Movie Tickets" href="/tickets?category=movie" />
            <CategoryIcon icon={CalendarIconLucide} label="Event Tickets" href="/tickets?category=event" />
            <CategoryIcon icon={TicketCategoryIcon} label="All Tickets" href="/tickets" />
         </div>

      </main>

       <footer className="py-4 border-t bg-background mt-auto">
         <div className="container text-center text-sm text-muted-foreground">
           © {new Date().getFullYear()} LastminIT tickets. All rights reserved.
         </div>
       </footer>
    </div>
  );
}
