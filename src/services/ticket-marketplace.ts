
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
const userPostedTicketsKey = 'userPostedTickets';
const userOrdersKey = 'userOrders';
const userDataKey = 'userData';


// --- LocalStorage Helper Functions ---

const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                let parsedData = JSON.parse(stored);
                if (Array.isArray(parsedData) && (key === marketplaceTicketsKey || key === userPostedTicketsKey || key === userOrdersKey)) {
                      parsedData = parsedData.map((ticket: Partial<Ticket>) => ({
                         ...ticket,
                         sellerId: ticket.sellerId || `unknown_${ticket.id || Math.random().toString(36).substring(7)}`,
                         status: ticket.status || 'available',
                         sellerVerified: ticket.sellerVerified === undefined ? false : ticket.sellerVerified,
                         sellerContactEmail: ticket.sellerContactEmail || undefined,
                         sellerContactPhone: ticket.sellerContactPhone || undefined,
                      }));
                } else if (key === userDataKey && parsedData && typeof parsedData === 'object' && 'aadhaarNumber' in parsedData) {
                    // Remove aadhaarNumber from loaded userData if it exists
                    const { aadhaarNumber, ...restOfData } = parsedData as any;
                    parsedData = restOfData;
                }
                return parsedData as T;
            } catch (e) {
                console.error(`Failed to parse ${key} from localStorage`, e);
            }
        }
    }
    if ((key === marketplaceTicketsKey || key === userPostedTicketsKey || key === userOrdersKey) && Array.isArray(defaultValue)) {
      return defaultValue.map((ticket: Partial<Ticket>) => ({
          ...ticket,
          sellerId: ticket.sellerId || `unknown_${ticket.id || Math.random().toString(36).substring(7)}`,
          status: ticket.status || 'available',
          sellerVerified: ticket.sellerVerified === undefined ? false : ticket.sellerVerified,
          sellerContactEmail: ticket.sellerContactEmail || undefined,
          sellerContactPhone: ticket.sellerContactPhone || undefined,
      })) as T;
    }
    return defaultValue;
};

const saveToLocalStorage = <T>(key: string, data: T) => {
    if (typeof window !== 'undefined') {
        try {
            let dataToSave = data;
            if (key === userDataKey && typeof data === 'object' && data !== null && 'aadhaarNumber' in data) {
                 const { aadhaarNumber, ...restOfData } = data as any; // Ensure aadhaarNumber is not saved
                 dataToSave = restOfData as T;
            }
            const stringifiedData = JSON.stringify(dataToSave);
            
            const quotaCheckLength = 4.5 * 1024 * 1024; 
            if (stringifiedData.length > quotaCheckLength) {
                 console.warn(`Data for ${key} is large (${(stringifiedData.length / (1024*1024)).toFixed(2)}MB) and might exceed localStorage quota.`);
                 
                 if ((key === marketplaceTicketsKey || key === userPostedTicketsKey || key === userOrdersKey) && Array.isArray(dataToSave) && dataToSave.length > 5) {
                    console.warn(`Attempting to trim ${key} data to save space.`);
                    const trimmedData = dataToSave.slice(-5).map((ticket: any) => { 
                        const { originalTicketDataUri, ...rest } = ticket;
                        if (originalTicketDataUri && originalTicketDataUri.length > 100 * 1024) { 
                            console.warn(`Removing large originalTicketDataUri for ticket ID ${ticket.id} from ${key} during quota save.`);
                            return rest;
                        }
                        return ticket;
                    });
                    localStorage.setItem(key, JSON.stringify(trimmedData));
                    console.warn(`${key} trimmed to last 5 entries. Some older data may have been removed to avoid quota issues.`);
                 } else {
                    console.error(`Could not save ${key} to localStorage due to size constraints without a clear trimming strategy.`);
                    throw new DOMException('QuotaExceededError', 'QuotaExceededError');
                 }
            } else {
                 localStorage.setItem(key, stringifiedData);
            }

            window.dispatchEvent(new StorageEvent('storage', {
                key: key,
                newValue: localStorage.getItem(key), 
                storageArea: localStorage,
            }));
        } catch (e) {
             console.error(`Failed to save ${key} to localStorage`, e);
             if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
                 throw e; 
             }
        }
    }
};

// --- Initial Data ---
const isCurrentUserVerifiedForDefault = (): boolean => {
    if (typeof window === 'undefined') return false;
    const storedUserData = localStorage.getItem(userDataKey);
    if (storedUserData) {
        try {
            const parsedData: UserData = JSON.parse(storedUserData);
            const currentUserId = getSimulatedCurrentUserId();
            if (currentUserId === 'currentUser') {
                 return !!(parsedData.email && parsedData.contact);
            }
        } catch (e) {
            console.error("Failed to parse userData for default ticket verification check", e);
        }
    }
    return false;
};


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
        sellerId: 'otherUser1',
        sellerVerified: false,
        sellerContactEmail: 'seller1@example.com',
        sellerContactPhone: '9876543210',
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
        sellerId: 'otherUser2',
        sellerVerified: true,
        sellerContactEmail: 'seller2_verified@example.com',
        sellerContactPhone: '9876543211',
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
        sellerId: 'currentUser', 
        sellerVerified: isCurrentUserVerifiedForDefault(),
        sellerContactEmail: 'currentuser@example.com', 
        sellerContactPhone: '1234567890', 
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
        sellerId: 'otherUser3',
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
        sellerId: 'currentUser',
        sellerVerified: isCurrentUserVerifiedForDefault(),
        sellerContactEmail: 'currentuser@example.com',
        sellerContactPhone: '1234567890',
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
        sellerId: 'otherUser4',
        sellerVerified: true,
        sellerContactEmail: 'seller4_verified@example.com',
        sellerContactPhone: '9876543213',
      },
];

// Module-level tickets variable - primarily used for initial load and by functions that modify it.
// Functions that only read tickets should ideally re-load from localStorage for freshness.
let tickets: Ticket[] = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());

if (typeof window !== 'undefined' && !localStorage.getItem(marketplaceTicketsKey)) {
    const currentUserId = getSimulatedCurrentUserId();
    if (currentUserId === 'currentUser') {
        const userDataString = localStorage.getItem(userDataKey);
        if (userDataString) {
            try {
                const currentUserData: UserData = JSON.parse(userDataString);
                tickets = tickets.map(ticket =>
                    ticket.sellerId === 'currentUser' && currentUserData.email
                        ? { ...ticket, sellerContactEmail: currentUserData.email, sellerContactPhone: currentUserData.contact, sellerVerified: isCurrentUserVerifiedForDefault() }
                        : ticket
                );
            } catch (e) { console.error("Error parsing current user data for default tickets", e); }
        }
    }
    saveToLocalStorage(marketplaceTicketsKey, tickets);
} else {
    const needsUpdate = tickets.some(ticket => !ticket.sellerId || !ticket.status || ticket.sellerVerified === undefined || ticket.sellerContactEmail === undefined || ticket.sellerContactPhone === undefined);
    if (needsUpdate) {
        tickets = tickets.map(ticket => ({
            ...ticket,
            sellerId: ticket.sellerId || `unknown_${ticket.id || Math.random().toString(36).substring(7)}`,
            status: ticket.status || 'available',
            sellerVerified: ticket.sellerVerified === undefined ? (ticket.sellerId === 'currentUser' ? isCurrentUserVerifiedForDefault() : false) : ticket.sellerVerified,
            sellerContactEmail: ticket.sellerContactEmail || (ticket.sellerId === 'currentUser' ? 'currentuser@example.com' : `seller_email_${ticket.id}@example.com`),
            sellerContactPhone: ticket.sellerContactPhone || (ticket.sellerId === 'currentUser' ? '1234567890' : `999888${Math.floor(Math.random()*10000).toString().padStart(4, '0')}`),
        }));
        saveToLocalStorage(marketplaceTicketsKey, tickets);
    }
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


const getUserPostedTickets = (): Ticket[] => {
    return getUniqueById(loadFromLocalStorage<Ticket[]>(userPostedTicketsKey, []));
};

const saveUserPostedTickets = (postedTickets: Ticket[]) => {
    const uniqueTickets = getUniqueById(postedTickets);
    const ticketsToSave = uniqueTickets.map(ticket => {
        const { originalTicketDataUri, ...rest } = ticket;
        if (originalTicketDataUri && originalTicketDataUri.length > 100 * 1024) { 
            console.warn(`Removing large originalTicketDataUri for ticket ID ${ticket.id} from userPostedTickets to save space.`);
            return rest;
        }
        return ticket;
    });
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
}): Promise<Ticket[]> {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async operation

  // Always load fresh from localStorage for this read operation
  const currentMarketplaceTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());

  if (filters?.ticketId) {
    const ticket = currentMarketplaceTickets.find(t => t.id === filters.ticketId);
    return ticket ? [ticket] : [];
  }

  let filteredTickets = currentMarketplaceTickets.filter(ticket => ticket.status === 'available');

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
        ticket.description.toLowerCase().includes(term) ||
        (ticket.location && ticket.location.toLowerCase().includes(term)) ||
        (ticket.fromCity && ticket.fromCity.toLowerCase().includes(term)) ||
        (ticket.toCity && ticket.toCity.toLowerCase().includes(term)) ||
        ticket.type.toLowerCase().includes(term)
    );
  }

  return filteredTickets;
}

export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  // Load fresh for this specific lookup
  const currentMarketplaceTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());
  const ticket = currentMarketplaceTickets.find(t => t.id === ticketId);
  return ticket || null;
}

export async function postTicket(ticketData: Omit<Ticket, 'id' | 'status' | 'sellerId' | 'sellerVerified' | 'sellerContactEmail' | 'sellerContactPhone'> & { originalTicketDataUri?: string }): Promise<Ticket> {
  await new Promise(resolve => setTimeout(resolve, 100));

  const currentUserId = getSimulatedCurrentUserId();
  let sellerIsVerified = false;
  let sellerEmail: string | undefined = undefined;
  let sellerPhone: string | undefined = undefined;

  if (typeof window !== 'undefined' && currentUserId !== 'anonymousUser') {
    const storedUserData = localStorage.getItem(userDataKey);
    if (storedUserData) {
        try {
            const parsedData: UserData = JSON.parse(storedUserData);
            sellerIsVerified = !!(parsedData.email && parsedData.contact);
            sellerEmail = parsedData.email;
            sellerPhone = parsedData.contact;
        } catch (e) {
            console.error("Failed to parse userData for seller verification status and contact info", e);
        }
    }
  }


  const newTicket: Ticket = {
    ...ticketData,
    id: Math.random().toString(36).substring(2, 15),
    status: 'available',
    sellerId: currentUserId,
    sellerVerified: sellerIsVerified,
    sellerContactEmail: sellerEmail,
    sellerContactPhone: sellerPhone,
  };

  // Load current tickets, add the new one, then save
  let currentMarketplaceTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());
  currentMarketplaceTickets.push(newTicket);

  try {
    saveToLocalStorage(marketplaceTicketsKey, currentMarketplaceTickets);
    if (currentUserId !== 'anonymousUser') {
        addUserPostedTicket(newTicket);
    }
  } catch (error) {
    if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
      console.error('LocalStorage quota exceeded while posting ticket.');
      // No need to pop here as currentMarketplaceTickets was a local copy for modification
      throw error;
    } else {
      console.error('An unexpected error occurred while posting ticket:', error);
      throw error;
    }
  }

  console.log('Posted Ticket:', newTicket);
  return newTicket;
}

export async function updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  let currentMarketplaceTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());
  const ticketIndex = currentMarketplaceTickets.findIndex(t => t.id === ticketId);

  if (ticketIndex === -1) {
    return null;
  }
  const originalTicket = currentMarketplaceTickets[ticketIndex];
  currentMarketplaceTickets[ticketIndex] = { ...originalTicket, ...updates };
  saveToLocalStorage(marketplaceTicketsKey, currentMarketplaceTickets);

  if (originalTicket.sellerId === getSimulatedCurrentUserId() && originalTicket.sellerId !== 'anonymousUser') {
    updateUserPostedTicket(ticketId, updates);
  }

  return currentMarketplaceTickets[ticketIndex];
}


export async function purchaseTicket(ticketId: string): Promise<{ success: boolean; message: string; ticket?: Ticket }> {
  await new Promise(resolve => setTimeout(resolve, 300));

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

  // ticketToUpdate.status = 'sold'; // Don't modify the local copy directly before calling updateTicket
  const updatedTicket = await updateTicket(ticketId, { status: 'sold' });

  if (updatedTicket) {
    addUserOrder(updatedTicket); 
    console.log(`Ticket ${ticketId} marked as sold by ${buyerId} (pending offline payment).`);
    
    let contactMessage = "Contact the seller ";
    if (updatedTicket.sellerContactEmail && updatedTicket.sellerContactPhone) {
        contactMessage += `at ${updatedTicket.sellerContactEmail} or ${updatedTicket.sellerContactPhone}`;
    } else if (updatedTicket.sellerContactEmail) {
        contactMessage += `at ${updatedTicket.sellerContactEmail}`;
    } else if (updatedTicket.sellerContactPhone) {
        contactMessage += `at ${updatedTicket.sellerContactPhone}`;
    } else {
        contactMessage += "using their listed contact details";
    }
    contactMessage += " to complete your purchase.";

    return { success: true, message: `Ticket ${ticketId} purchase initiated! ${contactMessage}`, ticket: updatedTicket };
  } else {
    // This case should ideally not be reached if updateTicket finds the ticket.
    return { success: false, message: `Failed to update ticket ${ticketId} status.`};
  }
}

export async function deleteTicket(ticketId: string): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const currentUserId = getSimulatedCurrentUserId();
    if (currentUserId === 'anonymousUser') {
        return { success: false, message: "User must be logged in to delete a ticket." };
    }

    let currentMarketplaceTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());
    const ticketIndex = currentMarketplaceTickets.findIndex(ticket => ticket.id === ticketId);

    if (ticketIndex === -1) {
        removeUserPostedTicket(ticketId); 
        return { success: false, message: `Ticket ${ticketId} not found in marketplace.` };
    }

    if (currentMarketplaceTickets[ticketIndex].sellerId !== currentUserId) {
        return { success: false, message: `You are not authorized to delete this ticket.` };
    }

    currentMarketplaceTickets.splice(ticketIndex, 1);
    saveToLocalStorage(marketplaceTicketsKey, currentMarketplaceTickets);
    removeUserPostedTicket(ticketId);

    console.log(`Ticket ${ticketId} deleted successfully by ${currentUserId}.`);
    return { success: true, message: `Your ticket listing has been removed.` };
}


export function getSimulatedCurrentUserId(): string {
    if (typeof window !== 'undefined') {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            return localStorage.getItem('userId') || 'currentUser';
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
        window.dispatchEvent(new StorageEvent('storage', { key: 'isLoggedIn' , storageArea: localStorage}));
        window.dispatchEvent(new StorageEvent('storage', { key: 'userId', storageArea: localStorage }));
    }
}


if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === marketplaceTicketsKey && event.newValue) {
             try {
                 const parsedTickets = JSON.parse(event.newValue).map((ticket: Partial<Ticket>) => ({
                     ...ticket,
                     sellerId: ticket.sellerId || `unknown_${ticket.id || Math.random().toString(36).substring(7)}`,
                     status: ticket.status || 'available',
                     sellerVerified: ticket.sellerVerified === undefined ? (ticket.sellerId === 'currentUser' ? isCurrentUserVerifiedForDefault() : false) : ticket.sellerVerified,
                     sellerContactEmail: ticket.sellerContactEmail || (ticket.sellerId === 'currentUser' ? 'currentuser@example.com' : `seller_email_${ticket.id}@example.com`),
                     sellerContactPhone: ticket.sellerContactPhone || (ticket.sellerId === 'currentUser' ? '1234567890' : `999888${Math.floor(Math.random()*10000).toString().padStart(4, '0')}`),
                 }));
                 // Update the module-level tickets variable if needed, or rely on components re-fetching
                 tickets = parsedTickets; 
                 console.log('Marketplace tickets updated from storage event.');
             } catch (e) {
                 console.error('Failed to parse marketplace tickets from storage event', e);
             }
        }
         if (event.key === userDataKey) { 
            console.log('User data updated from storage event.');
        }
    });
}
