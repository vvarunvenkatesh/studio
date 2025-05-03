
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
   * The location/venue, mainly for events/movies/sports. Can also hold platform/gate info for transport.
   */
  location: string;
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
   /**
   * The ID of the user selling the ticket.
   */
   sellerId: string; // Added sellerId
}

const marketplaceTicketsKey = 'marketplaceTickets';
const userPostedTicketsKey = 'userPostedTickets';
const userOrdersKey = 'userOrders';


// --- LocalStorage Helper Functions ---

const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                // Add migration for missing sellerId
                let parsedData = JSON.parse(stored);
                if (key === marketplaceTicketsKey || key === userPostedTicketsKey || key === userOrdersKey) {
                   if (Array.isArray(parsedData)) {
                      parsedData = parsedData.map((ticket: Partial<Ticket>) => ({
                         ...ticket,
                         // Assign a default sellerId if missing (e.g., 'unknown' or derive)
                         sellerId: ticket.sellerId || `unknown_${ticket.id || Math.random().toString(36).substring(7)}`,
                         status: ticket.status || 'available', // Ensure status defaults to available
                      }));
                   }
                }
                return parsedData as T;
            } catch (e) {
                console.error(`Failed to parse ${key} from localStorage`, e);
            }
        }
    }
    // Add sellerId and status to default value if it's ticket data
    if ((key === marketplaceTicketsKey || key === userPostedTicketsKey || key === userOrdersKey) && Array.isArray(defaultValue)) {
      return defaultValue.map((ticket: Partial<Ticket>) => ({
          ...ticket,
          sellerId: ticket.sellerId || `unknown_${ticket.id || Math.random().toString(36).substring(7)}`,
          status: ticket.status || 'available', // Ensure status defaults to available
      })) as T;
    }
    return defaultValue;
};

const saveToLocalStorage = <T>(key: string, data: T) => {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            // Dispatch storage event for reactivity across tabs/components
            window.dispatchEvent(new StorageEvent('storage', {
                key: key,
                newValue: JSON.stringify(data),
                storageArea: localStorage,
            }));
        } catch (e) {
             console.error(`Failed to save ${key} to localStorage`, e);
        }
    }
};

// --- Initial Data ---

const getDefaultTickets = (): Ticket[] => [
    {
        id: '1',
        type: 'train',
        description: 'Express train, window seat',
        price: 50,
        date: '2024-09-15',
        time: '09:30',
        location: 'Platform 5',
        fromCity: 'New York',
        toCity: 'Boston',
        status: 'available',
        originalTicketDataUri: undefined,
        sellerId: 'otherUser1', // Example seller
      },
      {
        id: '2',
        type: 'event',
        description: 'Concert ticket - Rock Band Live, General Admission',
        price: 75,
        date: '2024-10-22',
        time: '20:00',
        location: 'Boston Arena',
        status: 'available',
        sellerId: 'otherUser2', // Example seller
      },
       {
        id: '3',
        type: 'movie',
        description: 'Movie Premiere - Sci-Fi Adventure, Seat J12',
        price: 25,
        date: '2024-09-10',
        time: '19:00',
        location: 'Downtown Cinema',
        status: 'available',
        sellerId: 'currentUser', // Example seller is current user
      },
      {
        id: '4',
        type: 'bus',
        description: 'Comfort Coach, aisle seat',
        price: 35,
        date: '2024-09-05',
        time: '14:00',
        location: 'Gate 3B',
        fromCity: 'Philadelphia',
        toCity: 'Washington DC',
        status: 'available',
        sellerId: 'otherUser3', // Example seller
      },
        {
        id: '5',
        type: 'train',
        description: 'Sleeper car, lower berth',
        price: 120,
        date: '2024-09-20',
        time: '22:00',
        location: 'Track 12',
        fromCity: 'Chicago',
        toCity: 'Denver',
        status: 'available',
        sellerId: 'currentUser', // Example seller is current user
      },
       {
        id: '6',
        type: 'sports',
        description: 'Basketball Game - Section 102, Row 5, Seat 3',
        price: 90,
        date: '2024-11-05',
        time: '19:30',
        location: 'City Stadium',
        status: 'available',
        sellerId: 'otherUser4', // Example seller
      },
];

// Initialize global tickets state from localStorage or defaults
let tickets: Ticket[] = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());
// Ensure initial save if localStorage was empty and add sellerId if needed
if (typeof window !== 'undefined' && !localStorage.getItem(marketplaceTicketsKey)) {
    saveToLocalStorage(marketplaceTicketsKey, tickets);
} else {
    // Ensure loaded tickets have sellerId and status
    const needsUpdate = tickets.some(ticket => !ticket.sellerId || !ticket.status);
    if (needsUpdate) {
        tickets = tickets.map(ticket => ({
            ...ticket,
            sellerId: ticket.sellerId || `unknown_${ticket.id || Math.random().toString(36).substring(7)}`,
            status: ticket.status || 'available', // Ensure status defaults to available
        }));
        saveToLocalStorage(marketplaceTicketsKey, tickets);
    }
}


// --- Helper Functions for User-Specific Data ---

// Function to get unique items based on ID from an array
const getUniqueById = <T extends { id: string }>(items: T[]): T[] => {
    const seenIds = new Set<string>();
    return items.filter(item => {
        if (seenIds.has(item.id)) {
            return false;
        }
        seenIds.add(item.id);
        return true;
    });
};


const getUserPostedTickets = (): Ticket[] => getUniqueById(loadFromLocalStorage<Ticket[]>(userPostedTicketsKey, []));
const saveUserPostedTickets = (postedTickets: Ticket[]) => saveToLocalStorage(userPostedTicketsKey, getUniqueById(postedTickets)); // Ensure uniqueness on save
const addUserPostedTicket = (ticket: Ticket) => saveUserPostedTickets([...getUserPostedTickets(), ticket]);
const removeUserPostedTicket = (ticketId: string) => {
    const currentPosted = getUserPostedTickets();
    saveUserPostedTickets(currentPosted.filter(t => t.id !== ticketId));
};
const updateUserPostedTicket = (ticketId: string, updatedData: Partial<Ticket>) => {
    const currentPosted = getUserPostedTickets();
    saveUserPostedTickets(currentPosted.map(t => t.id === ticketId ? { ...t, ...updatedData } : t));
};

const getUserOrders = (): Ticket[] => getUniqueById(loadFromLocalStorage<Ticket[]>(userOrdersKey, []));
const saveUserOrders = (orders: Ticket[]) => saveToLocalStorage(userOrdersKey, getUniqueById(orders)); // Ensure uniqueness on save
const addUserOrder = (ticket: Ticket) => saveUserOrders([...getUserOrders(), ticket]);


// --- Public Service Functions ---

/**
 * Asynchronously retrieves a list of available tickets, optionally filtered.
 * Ensures the global `tickets` array is up-to-date with localStorage.
 * Filters out tickets with status 'sold'.
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

  // Refresh global tickets state from localStorage before filtering
  tickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());

  // Start with only available tickets
  let filteredTickets = tickets.filter(ticket => ticket.status === 'available');

  if (filters?.category) {
    filteredTickets = filteredTickets.filter(ticket => ticket.type === filters.category);
  }

  if (filters?.fromCity) {
    const fromLower = filters.fromCity.toLowerCase();
    filteredTickets = filteredTickets.filter(ticket => ticket.fromCity?.toLowerCase().includes(fromLower));
  }

  if (filters?.toCity) {
    const toLower = filters.toCity.toLowerCase();
    filteredTickets = filteredTickets.filter(ticket => ticket.toCity?.toLowerCase().includes(toLower));
  }

  // Return only available tickets for the browse pages
  return filteredTickets;
}

/**
 * Asynchronously posts a new ticket for sale.
 * Adds the ticket to the main marketplace list and the user's posted list in localStorage.
 *
 * @param ticketData The data for the ticket to be posted.
 * @returns A promise that resolves to the created Ticket object.
 */
export async function postTicket(ticketData: Omit<Ticket, 'id' | 'status' | 'sellerId'> & { originalTicketDataUri?: string }): Promise<Ticket> {
  await new Promise(resolve => setTimeout(resolve, 100));

  // Simulate getting current user ID
  const currentUserId = 'currentUser'; // Replace with actual user ID logic later

  const newTicket: Ticket = {
    ...ticketData,
    id: Math.random().toString(36).substring(2, 15),
    status: 'available',
    sellerId: currentUserId, // Set the seller ID
  };

  // Refresh global tickets state before adding
  tickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());

  tickets.push(newTicket);
  saveToLocalStorage(marketplaceTicketsKey, tickets); // Save updated marketplace list
  addUserPostedTicket(newTicket); // Add to user's posted list

  console.log('Posted Ticket:', newTicket);
  return newTicket;
}

/**
 * Asynchronously simulates purchasing a ticket.
 * Marks the ticket status as 'sold' in the marketplace and user's posted lists.
 * Adds the purchased ticket to the user's order history, ensuring uniqueness.
 *
 * @param ticketId The ID of the ticket to purchase.
 * @returns A promise that resolves to an object indicating success or failure, including the ticket data.
 */
export async function purchaseTicket(ticketId: string): Promise<{ success: boolean; message: string; ticket?: Ticket }> {
  await new Promise(resolve => setTimeout(resolve, 300));

  // Refresh global tickets state before purchase attempt
  tickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());

  const ticketIndex = tickets.findIndex(ticket => ticket.id === ticketId);

  if (ticketIndex === -1) {
    return { success: false, message: `Ticket with ID ${ticketId} not found.` };
  }

  const ticketToUpdate = tickets[ticketIndex];

  if (ticketToUpdate.status === 'sold') {
    return { success: false, message: `Ticket with ID ${ticketId} is already sold.`, ticket: ticketToUpdate };
  }

  // Simulate checking if the buyer is the seller
  const currentUserId = 'currentUser'; // Replace with actual user ID logic
  if (ticketToUpdate.sellerId === currentUserId) {
      return { success: false, message: `You cannot purchase your own ticket.` };
  }


  // Mark as sold
  ticketToUpdate.status = 'sold';
  saveToLocalStorage(marketplaceTicketsKey, tickets); // Save updated marketplace list
  updateUserPostedTicket(ticketId, { status: 'sold' }); // Update in user's posted list
  addUserOrder(ticketToUpdate); // Add to user's order history (will ensure uniqueness)

  console.log(`Ticket ${ticketId} purchased successfully.`);
  return { success: true, message: `Ticket ${ticketId} purchased successfully!`, ticket: ticketToUpdate };
}

/**
 * Asynchronously deletes a ticket listing.
 * Removes the ticket from the main marketplace list and the user's posted list in localStorage.
 * Only the seller should be able to delete. (Simulated check)
 *
 * @param ticketId The ID of the ticket to delete.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function deleteTicket(ticketId: string): Promise<{ success: boolean; message: string }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Refresh global tickets state before deleting
    tickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());

    const ticketIndex = tickets.findIndex(ticket => ticket.id === ticketId);

    if (ticketIndex === -1) {
        removeUserPostedTicket(ticketId); // Ensure removal from user list if missing from main
        console.warn(`Ticket with ID ${ticketId} not found in marketplace list for deletion.`);
        return { success: true, message: `Ticket ${ticketId} not found or already deleted.` };
    }

    // Simulate checking if the current user is the seller
    const currentUserId = 'currentUser'; // Replace with actual user ID logic
    if (tickets[ticketIndex].sellerId !== currentUserId) {
        return { success: false, message: `You are not authorized to delete this ticket.` };
    }

    // Proceed with deletion
    tickets.splice(ticketIndex, 1); // Remove from the main list

    // Save the updated marketplace list
    saveToLocalStorage(marketplaceTicketsKey, tickets);

    // Remove from the user's posted tickets list
    removeUserPostedTicket(ticketId);

    console.log(`Ticket ${ticketId} deleted successfully.`);
    return { success: true, message: `Ticket ${ticketId} deleted successfully.` };
}


// Optional: Add listeners for localStorage changes if needed for immediate cross-tab updates
// (The current implementation relies on components re-fetching or re-reading on relevant events/mounts)
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === marketplaceTicketsKey && event.newValue) {
             try {
                 // Make sure to parse and apply migrations/defaults if necessary
                 const parsedTickets = JSON.parse(event.newValue).map((ticket: Partial<Ticket>) => ({
                     ...ticket,
                     sellerId: ticket.sellerId || `unknown_${ticket.id || Math.random().toString(36).substring(7)}`,
                     status: ticket.status || 'available',
                 }));
                 tickets = parsedTickets;
                 console.log('Marketplace tickets updated from storage event.');
             } catch (e) {
                 console.error('Failed to parse marketplace tickets from storage event', e);
             }
        }
        // Add similar listeners for userPostedTicketsKey and userOrdersKey if needed
    });
}

