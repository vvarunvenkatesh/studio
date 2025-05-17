
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
   * Optional user-defined title for the ticket, especially for events, movies, sports.
   */
  title?: string;
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
  status?: 'available' | 'sold';
  /**
   * Optional data URI of the uploaded original ticket image/file.
   */
  originalTicketDataUri?: string;
   /**
   * The ID of the user selling the ticket.
   */
   sellerId: string;
   /**
    * Indicates if the seller was verified at the time of posting the ticket.
    * Verification is now based on having posted more than 3 tickets.
    */
   sellerVerified?: boolean;
   /**
    * The contact email of the seller.
    */
   sellerContactEmail?: string;
   /**
    * The contact phone number of the seller.
    */
   sellerContactPhone?: string;
}

// UserData interface now only includes fields relevant after Aadhaar removal
interface UserData {
  name: string;
  email: string;
  contact: string;
  gender: 'male' | 'female' | 'other' | string;
}


const marketplaceTicketsKey = 'marketplaceTickets';
const userOrdersKey = 'userOrders';
const userDataKey = 'userData';


// --- LocalStorage Helper Functions ---

const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                let parsedData = JSON.parse(stored);
                // Basic validation for ticket arrays to ensure essential fields are present
                if (Array.isArray(parsedData) && (key === marketplaceTicketsKey || key === userOrdersKey)) {
                      parsedData = parsedData.map((ticket: Partial<Ticket>) => ({
                         ...ticket,
                         id: ticket.id || Math.random().toString(36).substring(2, 15), // Ensure ID
                         sellerId: ticket.sellerId || `unknown_${ticket.id || Math.random().toString(36).substring(7)}`, // Ensure sellerId
                         status: ticket.status || 'available', // Default status
                         // sellerVerified is now determined dynamically or at post time based on count
                         sellerContactEmail: ticket.sellerContactEmail || undefined,
                         sellerContactPhone: ticket.sellerContactPhone || undefined,
                         title: ticket.title || undefined,
                      }));
                }
                return parsedData as T;
            } catch (e) {
                console.error(`Failed to parse ${key} from localStorage`, e);
            }
        }
    }
    if ((key === marketplaceTicketsKey || key === userOrdersKey) && Array.isArray(defaultValue)) {
      return defaultValue.map((ticket: Partial<Ticket>) => ({
          ...ticket,
          id: ticket.id || Math.random().toString(36).substring(2, 15),
          sellerId: ticket.sellerId || `unknown_${ticket.id || Math.random().toString(36).substring(7)}`,
          status: ticket.status || 'available',
          // sellerVerified determined dynamically
          sellerContactEmail: ticket.sellerContactEmail || undefined,
          sellerContactPhone: ticket.sellerContactPhone || undefined,
          title: ticket.title || undefined,
      })) as T;
    }
    return defaultValue;
};

const saveToLocalStorage = <T>(key: string, data: T) => {
    if (typeof window !== 'undefined') {
        try {
            let dataToSave = data;
            const stringifiedData = JSON.stringify(dataToSave);

            // Basic quota check - this is a very rough estimate. Real limits are around 5MB.
            const quotaCheckLength = 4.5 * 1024 * 1024; // 4.5 MB
            if (stringifiedData.length > quotaCheckLength) {
                 console.warn(`Data for ${key} is large (${(stringifiedData.length / (1024*1024)).toFixed(2)}MB) and might exceed localStorage quota.`);

                 // Attempt to trim large data if it's an array of tickets (e.g., marketplace or orders)
                 if ((key === marketplaceTicketsKey || key === userOrdersKey) && Array.isArray(dataToSave) && dataToSave.length > 5) { // Example: Keep last 5
                    console.warn(`Attempting to trim ${key} data to save space.`);
                    // More sophisticated trimming might be needed, e.g., removing oldest items
                    // Or removing large data like originalTicketDataUri from older entries
                    const trimmedData = dataToSave.slice(-5).map((ticket: any) => { // Keep most recent 5 for demo
                        const { originalTicketDataUri, ...rest } = ticket;
                        if (originalTicketDataUri && originalTicketDataUri.length > 100 * 1024) { // 100KB threshold for data URI
                            console.warn(`Removing large originalTicketDataUri for ticket ID ${ticket.id} from ${key} during quota save.`);
                            return rest;
                        }
                        return ticket;
                    });
                    localStorage.setItem(key, JSON.stringify(trimmedData));
                    console.warn(`${key} trimmed to last 5 entries. Some older data may have been removed to avoid quota issues.`);
                 } else {
                    // If not an array or a small array, or if trimming strategy is unclear, fail loudly
                    console.error(`Could not save ${key} to localStorage due to size constraints without a clear trimming strategy.`);
                    throw new DOMException('QuotaExceededError', 'QuotaExceededError'); // Let the caller handle this
                 }
            } else {
                 localStorage.setItem(key, stringifiedData);
            }

            // Dispatch storage event for reactivity across tabs/components
            window.dispatchEvent(new StorageEvent('storage', {
                key: key,
                newValue: localStorage.getItem(key), // Get the potentially trimmed value
                storageArea: localStorage,
            }));
        } catch (e) {
             console.error(`Failed to save ${key} to localStorage`, e);
             if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
                 throw e; // Re-throw QuotaExceededError to be handled by the caller
             }
             // For other errors, you might decide how to handle them, e.g., log and continue if non-critical.
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
        sellerId: 'defaultSellerExample1', // This seller has only 1 default ticket, so not verified by count
        sellerVerified: false,
        sellerContactEmail: 'seller1@example.com',
        sellerContactPhone: '9876543210',
      },
      {
        id: '2',
        type: 'event',
        title: 'Rock Band Live Concert',
        description: 'General Admission for the annual Rock Fest',
        price: 750,
        date: '2024-10-22',
        time: '20:00',
        location: 'Boston Arena',
        status: 'available',
        sellerId: 'verifiedSellerAmongDefaults', // This seller will have >3 tickets
        sellerVerified: true,
        sellerContactEmail: 'seller2_verified@example.com',
        sellerContactPhone: '9876543211',
      },
       {
        id: '3',
        type: 'movie',
        title: 'Sci-Fi Adventure - Premiere Night',
        description: 'Exclusive premiere screening, Seat J12',
        price: 250,
        date: '2024-09-10',
        time: '19:00',
        location: 'Downtown Cinema',
        status: 'available',
        sellerId: 'verifiedSellerAmongDefaults',
        sellerVerified: true,
        sellerContactEmail: 'movie_seller@example.com',
        sellerContactPhone: '1234509876',
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
        sellerId: 'defaultSellerExample3', // Not verified by count
        sellerVerified: false,
        sellerContactEmail: 'seller3@example.com',
        sellerContactPhone: '9876543212',
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
        sellerId: 'verifiedSellerAmongDefaults',
        sellerVerified: true,
        sellerContactEmail: 'train_seller_verified@example.com',
        sellerContactPhone: '1234567890',
      },
       {
        id: '6',
        type: 'sports',
        title: 'Champions League Final Match',
        description: 'Basketball Game - Section 102, Row 5, Seat 3',
        price: 900,
        date: '2024-11-05',
        time: '19:30',
        location: 'City Stadium',
        status: 'available',
        sellerId: 'verifiedSellerAmongDefaults', // This makes it 4 tickets for this seller
        sellerVerified: true,
        sellerContactEmail: 'seller4_verified@example.com',
        sellerContactPhone: '9876543213',
      },
];


// --- Initialize Marketplace Tickets ---
if (typeof window !== 'undefined' && !localStorage.getItem(marketplaceTicketsKey)) {
    saveToLocalStorage(marketplaceTicketsKey, getDefaultTickets());
}


const getUniqueById = <T extends { id: string }>(items: T[]): T[] => {
    const seenIds = new Set<string>();
    return items.filter(item => {
        if (!item || typeof item.id === 'undefined') {
            console.warn("Encountered invalid item object:", item);
            return false;
        }
        if (seenIds.has(item.id)) {
            return false;
        }
        seenIds.add(item.id);
        return true;
    });
};


// --- User Orders ---
const getUserOrders = (): Ticket[] => getUniqueById(loadFromLocalStorage<Ticket[]>(userOrdersKey, []));
const saveUserOrders = (orders: Ticket[]) => saveToLocalStorage(userOrdersKey, getUniqueById(orders));
const addUserOrder = (ticket: Ticket) => saveUserOrders([...getUserOrders(), ticket]);


// --- Ticket Marketplace Service Functions ---

// New function to determine verification status based on ticket count
export function isUserVerifiedByTicketCount(userId: string): boolean {
  if (userId === 'anonymousUser') return false;
  const allTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, []);
  const userTicketCount = allTickets.filter(ticket => ticket.sellerId === userId).length;
  return userTicketCount > 3;
}

// Function to update verification status for all tickets of a user
function updateUserTicketsVerificationStatus(userId: string, isVerified: boolean) {
  let allTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, []);
  allTickets = allTickets.map(ticket => {
    if (ticket.sellerId === userId) {
      return { ...ticket, sellerVerified: isVerified };
    }
    return ticket;
  });
  saveToLocalStorage(marketplaceTicketsKey, allTickets);
}


export async function getAvailableTickets(filters?: {
  category?: Ticket['type'] | 'transport' | 'all';
  fromCity?: string;
  toCity?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  ticketId?: string;
  location?: string; // For event-like location filtering
}): Promise<Ticket[]> {
  // Always load the latest from localStorage at the start of the function
  const allCurrentTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());

  if (filters?.ticketId) {
    const ticket = allCurrentTickets.find(t => t.id === filters.ticketId);
    return ticket ? [ticket] : [];
  }

  let filteredTickets = allCurrentTickets.filter(ticket => ticket.status === 'available');

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

  // Apply location filter specifically for event-like categories if provided
  if (filters?.location && (filters.category === 'movie' || filters.category === 'event' || filters.category === 'sports')) {
    const locationLower = filters.location.toLowerCase();
    filteredTickets = filteredTickets.filter(ticket => ticket.location?.toLowerCase().includes(locationLower));
  }

  if (filters?.minPrice !== undefined) {
      filteredTickets = filteredTickets.filter(ticket => ticket.price >= filters!.minPrice!);
  }
  if (filters?.maxPrice !== undefined) {
      filteredTickets = filteredTickets.filter(ticket => ticket.price <= filters!.maxPrice!);
  }

  if (filters?.startDate) {
      const start = new Date(filters.startDate + 'T00:00:00');
      filteredTickets = filteredTickets.filter(ticket => new Date(ticket.date + 'T00:00:00') >= start);
  }
  if (filters?.endDate) {
      const end = new Date(filters.endDate + 'T23:59:59');
      filteredTickets = filteredTickets.filter(ticket => new Date(ticket.date + 'T00:00:00') <= end);
  }

  if (filters?.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filteredTickets = filteredTickets.filter(ticket =>
        (ticket.title && ticket.title.toLowerCase().includes(term)) ||
        ticket.description.toLowerCase().includes(term) ||
        (ticket.location && ticket.location.toLowerCase().includes(term)) || // General location search
        (ticket.fromCity && ticket.fromCity.toLowerCase().includes(term)) ||
        (ticket.toCity && ticket.toCity.toLowerCase().includes(term)) ||
        (ticket.type.toLowerCase().includes(term))
    );
  }

  return filteredTickets;
}

export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  // Always load the latest from localStorage
  const currentMarketplaceTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());
  const ticket = currentMarketplaceTickets.find(t => t.id === ticketId);
  return ticket || null;
}

export async function postTicket(ticketData: Omit<Ticket, 'id' | 'status' | 'sellerId' | 'sellerVerified' | 'sellerContactEmail' | 'sellerContactPhone'> & { originalTicketDataUri?: string, title?: string }): Promise<Ticket> {

  const currentUserId = getSimulatedCurrentUserId();
  let sellerEmail: string | undefined = undefined;
  let sellerPhone: string | undefined = undefined;

  if (typeof window !== 'undefined' && currentUserId !== 'anonymousUser') {
    const storedUserData = localStorage.getItem(userDataKey);
    if (storedUserData) {
        try {
            const parsedData: UserData = JSON.parse(storedUserData);
            sellerEmail = parsedData.email;
            sellerPhone = parsedData.contact;
        } catch (e) {
            console.error("Failed to parse userData for seller contact info", e);
        }
    }
  }


  const newTicketDraft: Omit<Ticket, 'sellerVerified'> = { // sellerVerified will be set after counting
    ...ticketData,
    id: Math.random().toString(36).substring(2, 15),
    status: 'available',
    sellerId: currentUserId,
    sellerContactEmail: sellerEmail,
    sellerContactPhone: sellerPhone,
    title: ticketData.title || undefined,
  };

  let currentMarketplaceTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());
  // Temporarily add new ticket to count correctly
  const ticketsForCounting = [...currentMarketplaceTickets, newTicketDraft as Ticket];
  const sellerIsNowVerified = isUserVerifiedByTicketCountInternal(currentUserId, ticketsForCounting);

  const newTicket: Ticket = {
    ...newTicketDraft,
    sellerVerified: sellerIsNowVerified,
  };
  
  currentMarketplaceTickets.push(newTicket);

  // Update verification status for all tickets by this seller
  currentMarketplaceTickets = currentMarketplaceTickets.map(ticket => {
    if (ticket.sellerId === currentUserId) {
      return { ...ticket, sellerVerified: sellerIsNowVerified };
    }
    return ticket;
  });


  try {
    saveToLocalStorage(marketplaceTicketsKey, currentMarketplaceTickets);
  } catch (error) {
    if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
      console.error('LocalStorage quota exceeded while posting ticket.');
      throw error;
    } else {
      console.error('An unexpected error occurred while posting ticket:', error);
      throw error;
    }
  }
  return newTicket;
}

// Internal helper for isUserVerifiedByTicketCount to avoid circular dependencies if used in postTicket before saving
function isUserVerifiedByTicketCountInternal(userId: string, tickets: Ticket[]): boolean {
  if (userId === 'anonymousUser') return false;
  const userTicketCount = tickets.filter(ticket => ticket.sellerId === userId).length;
  return userTicketCount > 3;
}


export async function updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket | null> {
  let currentMarketplaceTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());
  const ticketIndex = currentMarketplaceTickets.findIndex(t => t.id === ticketId);

  if (ticketIndex === -1) {
    return null;
  }
  currentMarketplaceTickets[ticketIndex] = { ...currentMarketplaceTickets[ticketIndex], ...updates };
  saveToLocalStorage(marketplaceTicketsKey, currentMarketplaceTickets);

  return currentMarketplaceTickets[ticketIndex];
}


export async function purchaseTicket(ticketId: string): Promise<{ success: boolean; message: string; ticket?: Ticket }> {

  const buyerId = getSimulatedCurrentUserId();
  if (buyerId === 'anonymousUser') {
      return { success: false, message: "User must be logged in to purchase." };
  }

  let currentMarketplaceTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());
  const ticketIndex = currentMarketplaceTickets.findIndex(ticket => ticket.id === ticketId);

  if (ticketIndex === -1) {
    return { success: false, message: `Ticket with ID ${ticketId} not found.` };
  }

  const ticketToUpdate = currentMarketplaceTickets[ticketIndex];

  if (ticketToUpdate.status === 'sold') {
    return { success: false, message: `Ticket with ID ${ticketId} is already sold.`, ticket: ticketToUpdate };
  }

  if (ticketToUpdate.sellerId === buyerId) {
      return { success: false, message: `You cannot purchase your own ticket.` };
  }

  const updatedTicket = await updateTicket(ticketId, { status: 'sold' });

  if (updatedTicket) {
    addUserOrder(updatedTicket);
    console.log(`Ticket ${ticketId} marked as sold by ${buyerId} (pending offline payment).`);

    let contactMessage = "Contact the seller ";
    if (updatedTicket.sellerContactEmail && updatedTicket.sellerContactPhone) {
        contactMessage += `at ${updatedTicket.sellerContactEmail} or by phone at ${updatedTicket.sellerContactPhone}`;
    } else if (updatedTicket.sellerContactEmail) {
        contactMessage += `at ${updatedTicket.sellerContactEmail}`;
    } else if (updatedTicket.sellerContactPhone) {
        contactMessage += `by phone at ${updatedTicket.sellerContactPhone}`;
    } else {
        contactMessage += "using their listed contact details";
    }
    contactMessage += " to complete your purchase.";

    return { success: true, message: `Ticket ${ticketId} purchase initiated! ${contactMessage}`, ticket: updatedTicket };
  } else {
    return { success: false, message: `Failed to update ticket ${ticketId} status.`};
  }
}

export async function deleteTicket(ticketId: string): Promise<{ success: boolean; message: string }> {
    const currentUserId = getSimulatedCurrentUserId();
    if (currentUserId === 'anonymousUser') {
        return { success: false, message: "User must be logged in to delete a ticket." };
    }

    let currentMarketplaceTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());
    const ticketIndex = currentMarketplaceTickets.findIndex(ticket => ticket.id === ticketId);

    if (ticketIndex === -1) {
        return { success: false, message: `Ticket ${ticketId} not found in marketplace.` };
    }

    const ticketToDelete = currentMarketplaceTickets[ticketIndex];
    if (ticketToDelete.sellerId !== currentUserId) {
        return { success: false, message: `You are not authorized to delete this ticket.` };
    }

    currentMarketplaceTickets.splice(ticketIndex, 1);
    
    // After deleting, re-evaluate seller's verification status and update their remaining tickets
    const sellerIsNowVerified = isUserVerifiedByTicketCountInternal(currentUserId, currentMarketplaceTickets);
    currentMarketplaceTickets = currentMarketplaceTickets.map(ticket => {
        if (ticket.sellerId === currentUserId) {
          return { ...ticket, sellerVerified: sellerIsNowVerified };
        }
        return ticket;
      });

    saveToLocalStorage(marketplaceTicketsKey, currentMarketplaceTickets);

    console.log(`Ticket ${ticketId} deleted successfully by ${currentUserId}.`);
    return { success: true, message: `Your ticket listing has been removed.` };
}


// --- User Authentication Simulation ---
export function getSimulatedCurrentUserId(): string {
    if (typeof window !== 'undefined') {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userId = localStorage.getItem('userId');
        if (isLoggedIn && userId) {
            return userId; // Return the specific email/phone used for login
        }
    }
    return 'anonymousUser';
}

export function setSimulatedCurrentUserId(userId: string | null) {
    if (typeof window !== 'undefined') {
        if (userId) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userId', userId);
        } else {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userId');
        }
        // Dispatch events to notify other parts of the app
        window.dispatchEvent(new StorageEvent('storage', { key: 'isLoggedIn' , newValue: userId ? 'true' : null, storageArea: localStorage}));
        window.dispatchEvent(new StorageEvent('storage', { key: 'userId', newValue: userId, storageArea: localStorage }));
    }
}


// --- Storage Event Listener ---
// This helps sync state across tabs if localStorage is changed directly or by another tab
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === marketplaceTicketsKey && event.newValue) {
             try {
                 // This parsing and re-mapping can be a source of console logs if tickets are malformed,
                 // but is generally good for ensuring data integrity on load.
                 const parsedTickets = JSON.parse(event.newValue).map((ticket: Partial<Ticket>) => ({
                     ...ticket,
                     id: ticket.id || Math.random().toString(36).substring(2, 15),
                     sellerId: ticket.sellerId || `unknown_${ticket.id || Math.random().toString(36).substring(7)}`,
                     status: ticket.status || 'available',
                     // sellerVerified updated at post/delete time
                     sellerContactEmail: ticket.sellerContactEmail || undefined,
                     sellerContactPhone: ticket.sellerContactPhone || undefined,
                     title: ticket.title || undefined,
                 }));
                 console.log('Marketplace tickets updated from storage event.');
                 // Note: Components relying on this data should have their own useEffect listeners
                 // for 'storage' events to re-fetch/re-render if needed.
             } catch (e) {
                 console.error('Failed to parse marketplace tickets from storage event', e);
             }
        }
         if (event.key === userDataKey) {
            console.log('User data updated from storage event.');
        }
    });
}
