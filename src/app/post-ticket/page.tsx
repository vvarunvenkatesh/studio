
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
      {/* Remove explicit bottom padding pb-20/pb-12 */}
      <main className="flex-1 container py-8 md:py-12 relative z-10"> {/* Ensure content is above pseudo-element */}
        <div className="max-w-3xl mx-auto">
           {/* Adjust title color if movie type */}
            <h1 className={cn(
                "text-3xl font-bold mb-6 text-center md:text-left",
                ticketType === 'movie' ? 'text-white' : 'text-foreground'
             )}>Post a New Ticket</h1>
           <PostTicketForm onTypeChange={handleTypeChange} /> {/* Pass the callback */}
        </div>
      </main>
       {/* Footer removed */}
    </div>
  );
}
