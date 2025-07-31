
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, Timestamp, serverTimestamp, writeBatch, getDoc } from "firebase/firestore";

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
   * The date of the event or travel (YYYY-MM-DD string for input, Firestore Timestamp for storage).
   */
  date: string | Timestamp;
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
   * The ID of the user selling the ticket. (Will be Firebase Auth UID in a full setup)
   */
   sellerId: string;
   /**
    * Indicates if the seller was verified at the time of posting the ticket.
    * Verification is based on having posted >= 3 tickets.
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
   /**
    * Timestamp of when the ticket was created.
    */
   createdAt?: Timestamp; // For Firestore
}

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
                return JSON.parse(stored) as T;
            } catch (e) {
                console.error(`Failed to parse ${key} from localStorage`, e);
            }
        }
    }
    return defaultValue;
};

const saveToLocalStorage = <T>(key: string, data: T) => {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            window.dispatchEvent(new StorageEvent('storage', {
                key: key,
                newValue: JSON.stringify(data),
                storageArea: localStorage,
            }));
        } catch (e: any) {
             console.error(`Failed to save ${key} to localStorage`, e);
             if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
                 console.warn(`LocalStorage quota exceeded when trying to save ${key}. Data might not be fully persisted.`);
                 throw new Error('Storage limit reached. Could not save data. Please clear some space or try removing uploaded files.');
             }
        }
    }
};

// --- User Orders ---
const getUserOrders = (): Ticket[] => loadFromLocalStorage<Ticket[]>(userOrdersKey, []);
const saveUserOrders = (orders: Ticket[]) => saveToLocalStorage(userOrdersKey, orders);
const addUserOrder = (ticket: Ticket) => saveUserOrders([...getUserOrders(), ticket]);

// --- Ticket Marketplace Service Functions (Using LocalStorage) ---

export async function postTicket(
  ticketData: Omit<Ticket, 'id' | 'status' | 'sellerId' | 'sellerVerified' | 'sellerContactEmail' | 'sellerContactPhone' | 'createdAt' | 'date'> & { date: string, originalTicketDataUri?: string, title?: string }
): Promise<Ticket> {
  const currentUserId = getSimulatedCurrentUserId();
  if (currentUserId === 'anonymousUser') {
    throw new Error("User must be logged in to post a ticket.");
  }

  let sellerEmail: string | undefined = undefined;
  let sellerPhone: string | undefined = undefined;
  if (typeof window !== 'undefined') {
    const storedUserData = localStorage.getItem(userDataKey);
    if (storedUserData) {
        try {
            const parsedData: UserData = JSON.parse(storedUserData);
            sellerEmail = parsedData.email;
            sellerPhone = parsedData.contact;
        } catch (e) { console.error("Failed to parse userData for seller contact info", e); }
    }
  }

  const allTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, []);
  
  const newTicket: Ticket = {
    id: new Date().getTime().toString(), // Simple unique ID for localStorage
    ...ticketData,
    status: 'available',
    sellerId: currentUserId,
    sellerContactEmail: sellerEmail,
    sellerContactPhone: sellerPhone,
  };

  const updatedTickets = [...allTickets, newTicket];
  
  const sellerIsNowVerified = isUserVerifiedByTicketCountInternal(currentUserId, updatedTickets);
  newTicket.sellerVerified = sellerIsNowVerified;

  // If seller is now verified, update all their tickets
  if (sellerIsNowVerified) {
      for (const ticket of updatedTickets) {
          if (ticket.sellerId === currentUserId) {
              ticket.sellerVerified = true;
          }
      }
  }

  saveToLocalStorage(marketplaceTicketsKey, updatedTickets);
  return newTicket;
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
  location?: string;
}): Promise<Ticket[]> {
  const allTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());
  let availableTickets = allTickets.filter(ticket => ticket.status === 'available');

  if (!filters) {
    return availableTickets;
  }
  
  return availableTickets.filter(ticket => {
    // Category filter
    if (filters.category && filters.category !== 'all') {
        if (filters.category === 'transport') {
            if (ticket.type !== 'train' && ticket.type !== 'bus') return false;
        } else if (ticket.type !== filters.category) {
            return false;
        }
    }
    
    const isEventLike = ticket.type === 'movie' || ticket.type === 'event' || ticket.type === 'sports';

    // From/To city filters (apply only to non-event-like tickets)
    if (!isEventLike) {
        if (filters.fromCity && ticket.fromCity?.toLowerCase() !== filters.fromCity.toLowerCase()) return false;
        if (filters.toCity && ticket.toCity?.toLowerCase() !== filters.toCity.toLowerCase()) return false;
    }

    // Location filter (apply only to event-like tickets)
    if (isEventLike) {
        if (filters.location && !ticket.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
    }

    // Price filters (apply only to non-event-like tickets)
    if (!isEventLike) {
        if (filters.minPrice !== undefined && ticket.price < filters.minPrice) return false;
        if (filters.maxPrice !== undefined && ticket.price > filters.maxPrice) return false;
    }

    // Date filters
    if (filters.startDate) {
        const startDate = new Date(filters.startDate + 'T00:00:00');
        const ticketDate = new Date(ticket.date as string);
        if (ticketDate < startDate) return false;
    }
    if (filters.endDate) {
        const endDate = new Date(filters.endDate + 'T23:59:59');
        const ticketDate = new Date(ticket.date as string);
        if (ticketDate > endDate) return false;
    }

    // Search term filter
    if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const ticketTitle = (ticket.title || '').toLowerCase();
        const ticketDesc = ticket.description.toLowerCase();
        const ticketFrom = (ticket.fromCity || '').toLowerCase();
        const ticketTo = (ticket.toCity || '').toLowerCase();
        const ticketLoc = (ticket.location || '').toLowerCase();
        const ticketType = ticket.type.toLowerCase();

        if (
            !ticketTitle.includes(term) &&
            !ticketDesc.includes(term) &&
            !ticketFrom.includes(term) &&
            !ticketTo.includes(term) &&
            !ticketLoc.includes(term) &&
            !ticketType.includes(term)
        ) {
            return false;
        }
    }

    // Ticket ID filter
    if (filters.ticketId && ticket.id !== filters.ticketId) return false;

    return true;
  });
}

export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  const allTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, getDefaultTickets());
  return allTickets.find(ticket => ticket.id === ticketId) || null;
}

export async function purchaseTicket(ticketId: string): Promise<{ success: boolean; message: string; ticket?: Ticket }> {
  const buyerId = getSimulatedCurrentUserId();
  if (buyerId === 'anonymousUser') {
      return { success: false, message: "User must be logged in to purchase." };
  }

  const allTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, []);
  const ticketIndex = allTickets.findIndex(t => t.id === ticketId);

  if (ticketIndex === -1) {
    return { success: false, message: `Ticket with ID ${ticketId} not found.` };
  }
  
  const ticketToUpdate = allTickets[ticketIndex];

  if (ticketToUpdate.status === 'sold') {
    return { success: false, message: `Ticket with ID ${ticketId} is already sold.`, ticket: ticketToUpdate };
  }
  if (ticketToUpdate.sellerId === buyerId) {
      return { success: false, message: `You cannot purchase your own ticket.` };
  }

  ticketToUpdate.status = 'sold';
  allTickets[ticketIndex] = ticketToUpdate;
  
  saveToLocalStorage(marketplaceTicketsKey, allTickets);
  addUserOrder(ticketToUpdate);

  let contactMessage = "Contact the seller ";
    if (ticketToUpdate.sellerContactEmail && ticketToUpdate.sellerContactPhone) {
        contactMessage += `at ${ticketToUpdate.sellerContactEmail} or by phone at ${ticketToUpdate.sellerContactPhone}`;
    } else if (ticketToUpdate.sellerContactEmail) {
        contactMessage += `at ${ticketToUpdate.sellerContactEmail}`;
    } else if (ticketToUpdate.sellerContactPhone) {
        contactMessage += `by phone at ${ticketToUpdate.sellerContactPhone}`;
    } else {
        contactMessage += "using their listed contact details";
    }
  contactMessage += " to complete your purchase.";

  return { success: true, message: `Ticket ${ticketId} purchase initiated!`, ticket: ticketToUpdate };
}


export async function deleteTicket(ticketId: string): Promise<{ success: boolean; message: string }> {
    const currentUserId = getSimulatedCurrentUserId();
    if (currentUserId === 'anonymousUser') {
        throw new Error("User must be logged in to delete a ticket.");
    }
    
    let allTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, []);
    const ticketIndex = allTickets.findIndex(t => t.id === ticketId);

    if (ticketIndex === -1) {
        return { success: false, message: `Ticket ${ticketId} not found.` };
    }

    if (allTickets[ticketIndex].sellerId !== currentUserId) {
        return { success: false, message: `You are not authorized to delete this ticket.` };
    }

    allTickets.splice(ticketIndex, 1);
    
    const sellerIsStillVerified = isUserVerifiedByTicketCountInternal(currentUserId, allTickets);
    // If their status has now dropped to unverified, update all remaining tickets.
    if (!sellerIsStillVerified) {
        allTickets.forEach(ticket => {
            if (ticket.sellerId === currentUserId) {
                ticket.sellerVerified = false;
            }
        });
    }

    saveToLocalStorage(marketplaceTicketsKey, allTickets);
    return { success: true, message: `Your ticket listing has been removed.` };
}

// --- Verification Logic ---

function isUserVerifiedByTicketCountInternal(userId: string, tickets: Ticket[]): boolean {
  if (userId === 'anonymousUser') return false;
  const userTicketCount = tickets.filter(ticket => ticket.sellerId === userId).length;
  return userTicketCount >= 3;
}

export function isUserVerifiedByTicketCount(userId: string): boolean {
    if (userId === 'anonymousUser') return false;
    const allTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, []);
    return isUserVerifiedByTicketCountInternal(userId, allTickets);
}

export async function isUserProfileVerified(userId: string): Promise<boolean> {
    if (userId === 'anonymousUser') return false;
    const allTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, []);
    const postedTicketCount = allTickets.filter(t => t.sellerId === userId).length;
    if (postedTicketCount < 3) return false;
    const soldTicketCount = allTickets.filter(t => t.sellerId === userId && t.status === 'sold').length;
    return soldTicketCount > 0;
}


// --- User Authentication Simulation ---
export function getSimulatedCurrentUserId(): string {
    if (typeof window !== 'undefined') {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userId = localStorage.getItem('userId');
        if (isLoggedIn && userId) {
            return userId;
        }
    }
    return 'anonymousUser';
}

const getDefaultTickets = (): Ticket[] => {
  const verifiedSellerAmongDefaults = "verifiedSeller@example.com";
  return [
    {
      id: '1', type: 'movie', title: 'Action Movie Premiere', description: 'Best seats for the latest action blockbuster.', price: 250, date: '2024-08-15', time: '20:00', location: 'Cityplex Screen 1', sellerId: 'seller1@example.com', status: 'available', sellerVerified: false, sellerContactEmail: 'seller1@example.com', sellerContactPhone: '1111111111'
    },
    {
      id: '2', type: 'train', description: 'Comfortable AC chair car seat.', price: 800, date: '2024-08-05', time: '10:30', location: 'Platform 5', fromCity: 'Mumbai', toCity: 'Pune', sellerId: verifiedSellerAmongDefaults, status: 'available', sellerVerified: true, sellerContactEmail: verifiedSellerAmongDefaults, sellerContactPhone: '2222222222'
    },
    {
      id: '3', type: 'event', title: 'Grand Music Concert', description: 'Entry pass for the annual music festival.', price: 1200, date: '2024-09-10', time: '18:00', location: 'City Grounds', sellerId: 'seller2@example.com', status: 'available', sellerVerified: false, sellerContactEmail: 'seller2@example.com', sellerContactPhone: '3333333333'
    },
    { id: '4', type: 'bus', description: 'Volvo AC sleeper from Bangalore to Hyderabad.', price: 1100, date: '2024-08-20', time: '22:00', location: 'Pickup Point C', fromCity: 'Bangalore', toCity: 'Hyderabad', sellerId: verifiedSellerAmongDefaults, status: 'available', sellerVerified: true, sellerContactEmail: verifiedSellerAmongDefaults, sellerContactPhone: '2222222222'},
    { id: '5', type: 'sports', title: 'Cricket Match Finals', description: 'Premium stand ticket for the T20 final.', price: 3000, date: '2024-08-25', time: '19:00', location: 'National Stadium', sellerId: verifiedSellerAmongDefaults, status: 'available', sellerVerified: true, sellerContactEmail: verifiedSellerAmongDefaults, sellerContactPhone: '2222222222'},
    { id: '6', type: 'train', description: 'Last minute ticket to Delhi.', price: 1500, date: '2024-07-30', time: '08:00', location: 'Platform 2', fromCity: 'Jaipur', toCity: 'Delhi', sellerId: verifiedSellerAmongDefaults, status: 'sold', sellerVerified: true, sellerContactEmail: verifiedSellerAmongDefaults, sellerContactPhone: '2222222222'},
  ];
};

if (typeof window !== 'undefined' && !localStorage.getItem(marketplaceTicketsKey)) {
    saveToLocalStorage(marketplaceTicketsKey, getDefaultTickets());
}
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === marketplaceTicketsKey || event.key === userOrdersKey || event.key === userDataKey) {
             // console.log(`${event.key} updated from storage event.`);
        }
    });
}

    