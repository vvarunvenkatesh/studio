
'use client'; // Make this a client component to use state

import * as React from 'react';
import { Header } from '@/components/header';
import { PostTicketForm } from './_components/post-ticket-form';
import { cn } from '@/lib/utils'; // Import cn utility

export default function PostTicketPage() {
  // State to track the selected ticket type
  const [ticketType, setTicketType] = React.useState<string | undefined>(undefined);

  // Callback function for the form to update the type
  const handleTypeChange = (type: string | undefined) => {
    setTicketType(type);
  };

  return (
    // Use cn to conditionally apply the movie poster background
    <div className={cn(
      "flex min-h-screen flex-col",
      ticketType === 'movie' ? 'bg-movie-poster' : 'bg-muted/20' // Apply background based on state
    )}>
      {/* Header background should remain consistent, maybe slightly transparent for movie poster */}
       <Header className={ticketType === 'movie' ? 'bg-card/80 backdrop-blur-sm' : ''} />
      {/* Add pb-20 (or appropriate value based on BottomNavigation height) to prevent overlap */}
      <main className="flex-1 container py-8 md:py-12 relative z-10 pb-20 md:pb-12"> {/* Ensure content is above pseudo-element */}
        <div className="max-w-3xl mx-auto">
           {/* Adjust title color if movie type */}
            <h1 className={cn(
                "text-3xl font-bold mb-6 text-center md:text-left",
                ticketType === 'movie' ? 'text-white' : 'text-foreground'
             )}>Post a New Ticket</h1>
           <PostTicketForm onTypeChange={handleTypeChange} /> {/* Pass the callback */}
        </div>
      </main>
       {/* Removed footer as BottomNavigation exists */}
       {/* <footer className={cn(
          "py-4 border-t mt-auto relative z-10", // Ensure footer is above pseudo-element
          ticketType === 'movie' ? 'bg-black/50 text-white/80 border-white/20' : 'bg-background'
        )}>
        <div className="container text-center text-sm">
          © {new Date().getFullYear()} LastminIT tickets. All rights reserved.
        </div>
      </footer> */}
    </div>
  );
}
