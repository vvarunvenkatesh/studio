import type { Ticket } from '@/services/ticket-marketplace';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Ticket as TicketIcon, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface TicketCardProps {
  ticket: Ticket;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const formattedDate = format(new Date(ticket.date), 'PPP'); // Format date nicely

  return (
    <Card className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
           <CardTitle className="text-lg font-semibold capitalize flex items-center">
             <TicketIcon className="mr-2 h-5 w-5 text-primary" />
             {ticket.type} Ticket
           </CardTitle>
           <Badge variant="secondary">{ticket.id}</Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground line-clamp-2">
            {ticket.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
         <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{formattedDate}</span>
         </div>
         <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{ticket.location}</span>
         </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4">
         <div className="flex items-center font-semibold text-lg text-primary">
             <DollarSign className="mr-1 h-5 w-5" />
             {ticket.price.toFixed(2)}
         </div>
        {/* Placeholder for Buy Button - functionality to be added */}
        <Badge variant="outline">Available</Badge>
      </CardFooter>
    </Card>
  );
}
