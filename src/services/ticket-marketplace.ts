/**
 * Represents a ticket for an event or transportation.
 */
export interface Ticket {
  /**
   * The unique identifier for the ticket.
   */
  id: string;
  /**
   * The type of ticket (e.g., train, event, movie, bus, sports).
   */
  type: 'train' | 'event' | 'movie' | 'bus' | 'sports';
  /**
   * A description of the ticket.
   */
  description: string;
  /**
   * The price of the ticket.
   */
  price: number;
  /**
   * The date of the event or travel (YYYY-MM-DD).
   */
  date: string;
  /**
   * The time of the event or travel (HH:MM).
   */
  time: string;
  /**
   * The location/venue, mainly for events/movies/sports.
   */
  location: string; // Keep location for venue/general purpose
   /**
   * The departure city, mainly for train/bus.
   */
  fromCity?: string;
  /**
   * The destination city, mainly for train/bus.
   */
  toCity?: string;
  /**
   * Status of the ticket (e.g., available, sold).
   */
  status?: 'available' | 'sold'; // Optional status field
  /**
   * Optional data URI of the uploaded original ticket image/file.
   */
  originalTicketDataUri?: string;
}

// In-memory store for tickets (replace with actual API/DB calls)
// Initialize with some data if localStorage is empty
const initializeTickets = (): Ticket[] => {
    if (typeof window !== 'undefined') {
        const storedTickets = localStorage.getItem('marketplaceTickets');
        if (storedTickets) {
            try {
                return JSON.parse(storedTickets);
            } catch (e) {
                console.error("Failed to parse tickets from localStorage", e);
                // Fallback to default if parsing fails
            }
        }
    }
    // Default initial tickets if no localStorage data
    return [
      {
        id: '1',
        type: 'train',
        description: 'Express train, window seat',
        price: 50,
        date: '2024-09-15', // Future date
        time: '09:30',
        location: 'Platform 5', // General location detail
        fromCity: 'New York',
        toCity: 'Boston',
        status: 'available',
        originalTicketDataUri: undefined, // Example: No file uploaded initially
      },
      {
        id: '2',
        type: 'event',
        description: 'Concert ticket - Rock Band Live, General Admission',
        price: 75,
        date: '2024-10-22', // Future date
        time: '20:00',
        location: 'Boston Arena', // Venue
        // fromCity/toCity not applicable
        status: 'available',
      },
       {
        id: '3',
        type: 'movie',
        description: 'Movie Premiere - Sci-Fi Adventure, Seat J12',
        price: 25,
        date: '2024-09-10', // Future date
        time: '19:00',
        location: 'Downtown Cinema', // Venue
         // fromCity/toCity not applicable
        status: 'available',
      },
      {
        id: '4',
        type: 'bus',
        description: 'Comfort Coach, aisle seat',
        price: 35,
        date: '2024-09-05', // Future date
        time: '14:00',
        location: 'Gate 3B', // General location detail
        fromCity: 'Philadelphia',
        toCity: 'Washington DC',
        status: 'available',
      },
        {
        id: '5',
        type: 'train',
        description: 'Sleeper car, lower berth',
        price: 120,
        date: '2024-09-20', // Future date
        time: '22:00',
        location: 'Track 12',
        fromCity: 'Chicago',
        toCity: 'Denver',
        status: 'available',
      },
       {
        id: '6', // Added sports ticket
        type: 'sports',
        description: 'Basketball Game - Section 102, Row 5, Seat 3',
        price: 90,
        date: '2024-11-05', // Future date
        time: '19:30',
        location: 'City Stadium', // Venue
        status: 'available',
      },
    ];
};

let tickets: Ticket[] = initializeTickets();

// Save tickets to localStorage whenever they change
const saveTicketsToLocalStorage = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('marketplaceTickets', JSON.stringify(tickets));
        // Dispatch storage event for marketplaceTickets
         window.dispatchEvent(new StorageEvent('storage', {
           key: 'marketplaceTickets',
           newValue: JSON.stringify(tickets),
           storageArea: localStorage,
         }));
    }
};

// Helper to manage user's posted tickets in localStorage
const userPostedTicketsKey = 'userPostedTickets';

const getUserPostedTickets = (): Ticket[] => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(userPostedTicketsKey);
        try {
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Failed to parse userPostedTickets from localStorage:", e);
            return [];
        }
    }
    return [];
};

const saveUserPostedTickets = (postedTickets: Ticket[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(userPostedTicketsKey, JSON.stringify(postedTickets));
         // Dispatch storage event for userPostedTickets
         window.dispatchEvent(new StorageEvent('storage', {
            key: userPostedTicketsKey,
            newValue: JSON.stringify(postedTickets),
            storageArea: localStorage,
         }));
    }
};

const addUserPostedTicket = (ticket: Ticket) => {
    const currentPosted = getUserPostedTickets();
    saveUserPostedTickets([...currentPosted, ticket]);
};

const updateUserPostedTicket = (ticketId: string, updatedData: Partial<Ticket>) => {
    const currentPosted = getUserPostedTickets();
    const updatedList = currentPosted.map(t =>
        t.id === ticketId ? { ...t, ...updatedData } : t
    );
    saveUserPostedTickets(updatedList);
};


/**
 * Asynchronously retrieves a list of available tickets, optionally filtered.
 *
 * @param filters Optional filters for category, fromCity, toCity.
 * @returns A promise that resolves to an array of available Ticket objects matching the filters.
 */
export async function getAvailableTickets(filters?: {
  category?: Ticket['type'];
  fromCity?: string;
  toCity?: string;
}): Promise<Ticket[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 50));

  // Ensure tickets are loaded from localStorage initially or if updated elsewhere
   if (typeof window !== 'undefined') {
        const storedTickets = localStorage.getItem('marketplaceTickets');
        if (storedTickets) {
            try {
                tickets = JSON.parse(storedTickets);
            } catch (e) {
                console.error("Failed to parse tickets from localStorage during getAvailableTickets", e);
            }
        }
    }


  let filteredTickets = tickets.filter(ticket => ticket.status !== 'sold');

  if (filters?.category) {
    filteredTickets = filteredTickets.filter(ticket => ticket.type === filters.category);
  }

  if (filters?.fromCity) {
    // Case-insensitive search
    const fromLower = filters.fromCity.toLowerCase();
    filteredTickets = filteredTickets.filter(ticket => ticket.fromCity?.toLowerCase().includes(fromLower));
  }

  if (filters?.toCity) {
     // Case-insensitive search
    const toLower = filters.toCity.toLowerCase();
    filteredTickets = filteredTickets.filter(ticket => ticket.toCity?.toLowerCase().includes(toLower));
  }


  return filteredTickets;
}

/**
 * Asynchronously posts a new ticket for sale.
 * Adds the ticket to the in-memory store and localStorage.
 *
 * @param ticketData The data for the ticket to be posted. Must include type, description, price, date, time, and location/fromCity/toCity as appropriate. Can include optional originalTicketDataUri.
 * @returns A promise that resolves to the created Ticket object.
 */
// Update postTicket to accept the new optional field
export async function postTicket(ticketData: Omit<Ticket, 'id' | 'status'> & { originalTicketDataUri?: string }): Promise<Ticket> {
   // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const newTicket: Ticket = {
    ...ticketData,
    id: Math.random().toString(36).substring(2, 15), // Generate a simple random ID
    status: 'available', // New tickets are available by default
    // originalTicketDataUri is already included via ...ticketData
  };

   // Ensure specific fields are present based on type (optional backend validation)
   if ((newTicket.type === 'train' || newTicket.type === 'bus') && (!newTicket.fromCity || !newTicket.toCity)) {
     console.warn(`Warning: Train/Bus ticket posted without 'fromCity' or 'toCity' (ID: ${newTicket.id})`);
   }
   // Updated check for event, movie, or sports
   if ((newTicket.type === 'event' || newTicket.type === 'movie' || newTicket.type === 'sports') && !newTicket.location) {
      console.warn(`Warning: Event/Movie/Sports ticket posted without 'location' (ID: ${newTicket.id})`);
   }


  tickets.push(newTicket);
  saveTicketsToLocalStorage(); // Save updated list to marketplace localStorage
  addUserPostedTicket(newTicket); // Add to user's posted tickets localStorage

  console.log('Posted Ticket:', newTicket);
  // console.log('Current Tickets:', tickets);
  return newTicket;
}


/**
 * Asynchronously simulates purchasing a ticket.
 * Marks the ticket status as 'sold' in the in-memory store and localStorage.
 *
 * @param ticketId The ID of the ticket to purchase.
 * @returns A promise that resolves to an object indicating success or failure, and includes the ticket data if successful.
 */
 // Return the ticket data on successful purchase
export async function purchaseTicket(ticketId: string): Promise<{ success: boolean; message: string; ticket?: Ticket }> {
  // Simulate API call delay (e.g., payment processing)
  await new Promise(resolve => setTimeout(resolve, 300));

   // Ensure tickets are loaded from localStorage before purchase attempt
   if (typeof window !== 'undefined') {
        const storedTickets = localStorage.getItem('marketplaceTickets');
        if (storedTickets) {
            try {
                tickets = JSON.parse(storedTickets);
            } catch (e) {
                console.error("Failed to parse tickets from localStorage during purchaseTicket", e);
                // Decide how to handle this - maybe return an error?
            }
        }
    }


  const ticketIndex = tickets.findIndex(ticket => ticket.id === ticketId);

  if (ticketIndex === -1) {
    return { success: false, message: `Ticket with ID ${ticketId} not found.` };
  }

  if (tickets[ticketIndex].status === 'sold') {
    // Return ticket data even if already sold, so frontend can potentially still show download link if needed
    return { success: false, message: `Ticket with ID ${ticketId} is already sold.`, ticket: tickets[ticketIndex] };
  }

  // Mark the ticket as sold
  tickets[ticketIndex].status = 'sold';
  saveTicketsToLocalStorage(); // Save updated marketplace list
  updateUserPostedTicket(ticketId, { status: 'sold' }); // Update in user's posted list

  console.log(`Ticket ${ticketId} purchased successfully.`);
  // console.log('Updated Tickets:', tickets);

  // Add purchased ticket to user's order history
  if (typeof window !== 'undefined') {
     try {
       const existingOrdersString = localStorage.getItem('userOrders');
       const existingOrders: Ticket[] = existingOrdersString ? JSON.parse(existingOrdersString) : [];
       // Add the newly purchased ticket
       existingOrders.push(tickets[ticketIndex]); // Add the updated ticket data
       localStorage.setItem('userOrders', JSON.stringify(existingOrders));
       // Optional: Dispatch storage event if other components need to react
         window.dispatchEvent(new StorageEvent('storage', {
           key: 'userOrders',
           newValue: JSON.stringify(existingOrders),
           storageArea: localStorage,
         }));
     } catch (e) {
       console.error("Failed to save order to localStorage:", e);
       // Optionally inform user that saving the order failed
     }
   }


  // Return the full ticket object on success
  return { success: true, message: `Ticket ${ticketId} purchased successfully!`, ticket: tickets[ticketIndex] };
}
