
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
                if (Array.isArray(parsedData)) {
                   if (key === marketplaceTicketsKey || key === userPostedTicketsKey || key === userOrdersKey) {
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
             // Re-throw specific errors like QuotaExceededError if needed by calling code
             if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
                 throw e; // Or handle it more gracefully, e.g., show a toast
             }
        }
    }
};

// --- Initial Data ---

const getDefaultTickets = (): Ticket[] => [
    {
        id: '1',
        type: 'train',
        description: 'Express train, window seat',
        price: 500,
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
        price: 750,
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
        price: 250,
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
        price: 350,
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
        price: 1200,
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
        price: 900,
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
        if (!item || typeof item.id === 'undefined') {
            console.warn("Encountered invalid item object:", item);
            return false; // Skip invalid entries
        }
        if (seenIds.has(item.id)) {
            return false;
        }
        seenIds.add(item.id);
        return true;
    });
};


const getUserPostedTickets = (): Ticket[] => {
    return getUniqueById(loadFromLocalStorage<Ticket[]>(userPostedTicketsKey, []));
};

const saveUserPostedTickets = (postedTickets: Ticket[]) => {
    const uniqueTickets = getUniqueById(postedTickets);
    // Do not save originalTicketDataUri for userPostedTickets to save space.
    // It's kept in the main marketplaceTickets.
    const ticketsToSave = uniqueTickets.map(({ originalTicketDataUri, ...ticket }) => ticket);
    saveToLocalStorage(userPostedTicketsKey, ticketsToSave);
};

const addUserPostedTicket = (ticket: Ticket) => {
    saveUserPostedTickets([...getUserPostedTickets(), ticket]);
};

const removeUserPostedTicket = (ticketId: string) => {
    const currentPosted = getUserPostedTickets();
    saveUserPostedTickets(currentPosted.filter(t => t.id !== ticketId));
};

const updateUserPostedTicket = (ticketId: string, updatedData: Partial<Ticket>) => {
    const currentPosted = getUserPostedTickets();
    saveUserPostedTickets(currentPosted.map(t => t.id === ticketId ? { ...t, ...updatedData } : t));
};

const getUserOrders = (): Ticket[] => getUniqueById(loadFromLocalStorage<Ticket[]>(userOrdersKey, []));
const saveUserOrders = (orders: Ticket[]) => saveToLocalStorage(userOrdersKey, getUniqueById(orders));
const addUserOrder = (ticket: Ticket) => saveUserOrders([...getUserOrders(), ticket]);


// --- Public Service Functions ---

/**
 * Asynchronously retrieves a list of available tickets, optionally filtered.
 * Ensures the global `tickets` array is up-to-date with localStorage.
 * Filters out tickets with status 'sold'.
 *
 * @param filters Optional filters for category, fromCity, toCity, price range, and date range.
 * @returns A promise that resolves to an array of available Ticket objects matching the filters.
 */
export async function getAvailableTickets(filters?: {
  category?: Ticket['type'] | 'transport' | 'all'; // Allow 'transport' as a special category
  fromCity?: string;
  toCity?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}): Promise<Ticket[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 50));

  // Refresh global tickets state from localStorage before filtering
  tickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());

  let filteredTickets = tickets.filter(ticket => ticket.status === 'available');

  if (filters?.category) {
    if (filters.category === 'transport') {
      filteredTickets = filteredTickets.filter(ticket => ticket.type === 'train' || ticket.type === 'bus');
    } else if (filters.category !== 'all') {
      filteredTickets = filteredTickets.filter(ticket => ticket.type === filters.category);
    }
  }


  if (filters?.fromCity) {
    const fromLower = filters.fromCity.toLowerCase();
    filteredTickets = filteredTickets.filter(ticket => ticket.fromCity?.toLowerCase().includes(fromLower));
  }

  if (filters?.toCity) {
    const toLower = filters.toCity.toLowerCase();
    filteredTickets = filteredTickets.filter(ticket => ticket.toCity?.toLowerCase().includes(toLower));
  }

  if (filters?.minPrice !== undefined) {
      filteredTickets = filteredTickets.filter(ticket => ticket.price >= filters!.minPrice!);
  }
  if (filters?.maxPrice !== undefined) {
      filteredTickets = filteredTickets.filter(ticket => ticket.price <= filters!.maxPrice!);
  }

  if (filters?.startDate) {
      const start = new Date(filters.startDate + 'T00:00:00'); // Ensure comparison starts at the beginning of the day
      filteredTickets = filteredTickets.filter(ticket => new Date(ticket.date + 'T00:00:00') >= start);
  }
  if (filters?.endDate) {
      const end = new Date(filters.endDate + 'T23:59:59'); // Ensure comparison ends at the end of the day
      filteredTickets = filteredTickets.filter(ticket => new Date(ticket.date + 'T00:00:00') <= end);
  }

  return filteredTickets;
}

/**
 * Retrieves a single ticket by its ID.
 * Ensures the global `tickets` array is up-to-date with localStorage.
 *
 * @param ticketId The ID of the ticket to retrieve.
 * @returns A promise that resolves to the Ticket object or null if not found.
 */
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate API delay
  tickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());
  const ticket = tickets.find(t => t.id === ticketId);
  return ticket || null;
}


/**
 * Asynchronously posts a new ticket for sale.
 * Adds the ticket to the main marketplace list and the user's posted list in localStorage.
 *
 * @param ticketData The data for the ticket to be posted, including the optional data URI.
 * @returns A promise that resolves to the created Ticket object.
 * @throws Will re-throw QuotaExceededError if saving to localStorage fails.
 */
export async function postTicket(ticketData: Omit<Ticket, 'id' | 'status' | 'sellerId'> & { originalTicketDataUri?: string }): Promise<Ticket> {
  await new Promise(resolve => setTimeout(resolve, 100));

  const currentUserId = getSimulatedCurrentUserId();

  const newTicket: Ticket = {
    ...ticketData,
    id: Math.random().toString(36).substring(2, 15),
    status: 'available',
    sellerId: currentUserId,
  };

  tickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());
  tickets.push(newTicket);

  try {
    saveToLocalStorage(marketplaceTicketsKey, tickets);
    if (currentUserId !== 'anonymousUser') { // Only add to user's posted list if logged in
        addUserPostedTicket(newTicket);
    }
  } catch (error) {
    if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
      console.error('LocalStorage quota exceeded while posting ticket.');
      tickets.pop(); // Remove the ticket from the in-memory array if save failed
      throw error; // Re-throw to be caught by the form submission handler
    } else {
      console.error('An unexpected error occurred while posting ticket:', error);
      tickets.pop(); // Remove the ticket from the in-memory array
      throw error; // Re-throw for other errors
    }
  }

  console.log('Posted Ticket:', newTicket);
  return newTicket;
}

/**
 * Updates a ticket in the marketplace.
 * (Currently only used to mark as sold, but could be extended)
 *
 * @param ticketId The ID of the ticket to update.
 * @param updates Partial ticket data to update.
 * @returns A promise that resolves to the updated Ticket object or null if not found.
 */
export async function updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  tickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);
  if (ticketIndex === -1) {
    return null;
  }
  const originalTicket = tickets[ticketIndex];
  tickets[ticketIndex] = { ...originalTicket, ...updates };
  saveToLocalStorage(marketplaceTicketsKey, tickets);

  // Also update in user's posted tickets if they are the seller
  if (originalTicket.sellerId === getSimulatedCurrentUserId() && originalTicket.sellerId !== 'anonymousUser') {
    updateUserPostedTicket(ticketId, updates);
  }

  return tickets[ticketIndex];
}


/**
 * Asynchronously simulates purchasing a ticket.
 * Marks the ticket status as 'sold' in the marketplace and user's posted lists.
 * Adds the purchased ticket (including data URI) to the user's order history.
 *
 * @param ticketId The ID of the ticket to purchase.
 * @returns A promise that resolves to an object indicating success or failure, including the ticket data.
 */
export async function purchaseTicket(ticketId: string): Promise<{ success: boolean; message: string; ticket?: Ticket }> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const buyerId = getSimulatedCurrentUserId();
  if (buyerId === 'anonymousUser') {
      return { success: false, message: "User must be logged in to purchase." };
  }

  tickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());
  const ticketIndex = tickets.findIndex(ticket => ticket.id === ticketId);

  if (ticketIndex === -1) {
    return { success: false, message: `Ticket with ID ${ticketId} not found.` };
  }

  const ticketToUpdate = tickets[ticketIndex];

  if (ticketToUpdate.status === 'sold') {
    return { success: false, message: `Ticket with ID ${ticketId} is already sold.`, ticket: ticketToUpdate };
  }

  if (ticketToUpdate.sellerId === buyerId) {
      return { success: false, message: `You cannot purchase your own ticket.` };
  }

  ticketToUpdate.status = 'sold';
  // The originalTicketDataUri is already part of ticketToUpdate if it was posted with one
  const updatedTicket = await updateTicket(ticketId, { status: 'sold' });

  if (updatedTicket) {
    addUserOrder(updatedTicket); // Add to user's order history (includes URI)
    console.log(`Ticket ${ticketId} purchased successfully by ${buyerId}.`);
    return { success: true, message: `Ticket ${ticketId} purchased successfully!`, ticket: updatedTicket };
  } else {
    return { success: false, message: `Failed to update ticket ${ticketId} status during purchase.`};
  }
}

/**
 * Asynchronously deletes a ticket listing.
 * Removes the ticket from the main marketplace list and the user's posted list in localStorage.
 * Only the seller should be able to delete.
 *
 * @param ticketId The ID of the ticket to delete.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function deleteTicket(ticketId: string): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const currentUserId = getSimulatedCurrentUserId();
    if (currentUserId === 'anonymousUser') {
        return { success: false, message: "User must be logged in to delete a ticket." };
    }

    tickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());
    const ticketIndex = tickets.findIndex(ticket => ticket.id === ticketId);

    if (ticketIndex === -1) {
        removeUserPostedTicket(ticketId); // Ensure it's removed from user's list too, if it was there
        return { success: true, message: `Ticket ${ticketId} not found or already deleted from marketplace.` };
    }

    if (tickets[ticketIndex].sellerId !== currentUserId) {
        return { success: false, message: `You are not authorized to delete this ticket.` };
    }

    tickets.splice(ticketIndex, 1);
    saveToLocalStorage(marketplaceTicketsKey, tickets);
    removeUserPostedTicket(ticketId);

    console.log(`Ticket ${ticketId} deleted successfully by ${currentUserId}.`);
    return { success: true, message: `Ticket ${ticketId} deleted successfully.` };
}


// Helper function in ticket-marketplace.ts to simulate getting current user's ID
export function getSimulatedCurrentUserId(): string {
    if (typeof window !== 'undefined') {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            // In a real app, you'd have a more robust way to get/store user ID
            return localStorage.getItem('userId') || 'currentUser';
        }
    }
    return 'anonymousUser';
}

// This function could be expanded if user IDs become more complex
export function setSimulatedCurrentUserId(userId: string | null) {
    if (typeof window !== 'undefined') {
        if (userId) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userId', userId);
        } else {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userId');
        }
        // Dispatch storage event to notify other parts of the app
        window.dispatchEvent(new StorageEvent('storage', { key: 'isLoggedIn' }));
        window.dispatchEvent(new StorageEvent('storage', { key: 'userId' }));
    }
}


// Optional: Add listeners for localStorage changes
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === marketplaceTicketsKey && event.newValue) {
             try {
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
    });
}
