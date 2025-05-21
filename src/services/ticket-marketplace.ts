
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, Timestamp, serverTimestamp } from "firebase/firestore";

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
  date: string; // Keep as string for form compatibility, convert to Timestamp for Firestore
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
   * The ID of the user selling the ticket. (Will be Firebase Auth UID)
   */
   sellerId: string;
   /**
    * Indicates if the seller was verified.
    * Verification based on posting >= 3 tickets AND having at least 1 sold ticket.
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
  // Aadhaar removed
}

const marketplaceTicketsKey = 'marketplaceTickets'; // Will be replaced by Firestore collection "tickets"
const userOrdersKey = 'userOrders'; // Will be replaced by Firestore subcollection or separate collection "orders"
const userDataKey = 'userData'; // User profile data, ideally from Firebase Auth user profile

// --- IMPORTANT ---
// The following functions still use localStorage and are for client-side simulation of user identity
// and managing temporary UI state. In a full Firebase implementation,
// user identity would come from Firebase Auth, and user-specific data like orders
// would be queried from Firestore based on the authenticated user's ID.

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
        } catch (e) {
             console.error(`Failed to save ${key} to localStorage`, e);
             if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
                 // Handle quota exceeded error, e.g., by notifying the user or attempting to trim data
                 console.warn(`LocalStorage quota exceeded when trying to save ${key}. Data might not be fully persisted.`);
                 // Optionally re-throw to let the caller handle it
                 // throw e;
             }
        }
    }
};

// --- User Orders (still uses localStorage for now, would migrate to Firestore) ---
const getUserOrders = (): Ticket[] => loadFromLocalStorage<Ticket[]>(userOrdersKey, []);
const saveUserOrders = (orders: Ticket[]) => saveToLocalStorage(userOrdersKey, orders);
const addUserOrder = (ticket: Ticket) => saveUserOrders([...getUserOrders(), ticket]);


// --- Ticket Marketplace Service Functions ---
// Most of these functions will need to be refactored to use Firestore.
// The `postTicket` function below is an EXAMPLE of how one such function would change.

/**
 * EXAMPLE: Posts a new ticket to Firestore.
 * Note: This is a simplified example. Seller verification, contact details,
 * and updating existing tickets for seller verification status would require
 * more complex Firestore queries and logic.
 */
export async function postTicket(
  ticketData: Omit<Ticket, 'id' | 'status' | 'sellerId' | 'sellerVerified' | 'sellerContactEmail' | 'sellerContactPhone' | 'createdAt'> & { originalTicketDataUri?: string, title?: string }
): Promise<Ticket> {
  // IMPORTANT: In a real app, currentUserId would come from Firebase Auth.
  const currentUserId = getSimulatedCurrentUserId();
  if (currentUserId === 'anonymousUser') {
    throw new Error("User must be logged in to post a ticket.");
  }

  // Attempt to get seller contact details from localStorage (temporary)
  // In a real app, this would come from the authenticated user's profile in Firestore.
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

  // TODO: Seller verification logic needs to query Firestore for ticket counts.
  // For this example, we'll set it to false and note that it needs to be updated.
  const sellerIsVerified = false; // Placeholder: Implement Firestore query for actual verification

  const newTicketDataForFirestore = {
    ...ticketData,
    type: ticketData.type,
    title: ticketData.title || null,
    description: ticketData.description,
    price: ticketData.price,
    date: ticketData.date, // Store as string, consider Timestamp for querying
    time: ticketData.time,
    location: ticketData.location,
    fromCity: ticketData.fromCity || null,
    toCity: ticketData.toCity || null,
    originalTicketDataUri: ticketData.originalTicketDataUri || null,
    status: 'available' as const,
    sellerId: currentUserId,
    sellerVerified: sellerIsVerified, // This needs to be dynamically determined from Firestore
    sellerContactEmail: sellerEmail || null,
    sellerContactPhone: sellerPhone || null,
    createdAt: serverTimestamp(), // Use Firestore server timestamp
  };

  try {
    // Add a new document with a generated ID to the "tickets" collection.
    const docRef = await addDoc(collection(db, "tickets"), newTicketDataForFirestore);
    console.log("Ticket posted to Firestore with ID: ", docRef.id);
    // Return the ticket data including the new ID and any server-generated fields.
    // For a proper return, you might want to fetch the document after creation if using serverTimestamp.
    // For simplicity here, we're returning the client-side data with the new ID.
    return { ...ticketData, id: docRef.id, status: 'available', sellerId: currentUserId, sellerVerified, sellerContactEmail, sellerContactPhone, createdAt: Timestamp.now() } as Ticket;
  } catch (error: any) {
    console.error("Error posting ticket to Firestore: ", error);
    throw new Error("Failed to post ticket. Please try again.");
  }
}

// --- Functions below still use localStorage and need to be refactored for Firestore ---

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
  console.warn("getAvailableTickets is still using localStorage. Refactor for Firestore.");
  const allCurrentTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, []);

  if (filters?.ticketId) {
    const ticket = allCurrentTickets.find(t => t.id === filters.ticketId);
    return ticket ? [ticket] : [];
  }
  // ... (rest of existing localStorage filtering logic) ...
  let filteredTickets = allCurrentTickets.filter(ticket => ticket.status === 'available');

  if (filters?.category) {
    if (filters.category === 'transport') {
      filteredTickets = filteredTickets.filter(ticket => ticket.type === 'train' || ticket.type === 'bus');
    } else if (filters.category !== 'all') {
      filteredTickets = filteredTickets.filter(ticket => ticket.type === filters.category);
    }
  }

  if (filters?.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filteredTickets = filteredTickets.filter(ticket =>
        (ticket.title && ticket.title.toLowerCase().includes(term)) ||
        ticket.description.toLowerCase().includes(term) ||
        (ticket.location && ticket.location.toLowerCase().includes(term)) ||
        (ticket.fromCity && ticket.fromCity.toLowerCase().includes(term)) ||
        (ticket.toCity && ticket.toCity.toLowerCase().includes(term)) ||
        (ticket.type.toLowerCase().includes(term))
    );
  }
   if (filters?.location) { // General location filter, can apply to events or transport stop names
    const locationLower = filters.location.toLowerCase();
    filteredTickets = filteredTickets.filter(ticket => ticket.location?.toLowerCase().includes(locationLower));
  }


  if (filters?.fromCity && !(filters.category === 'movie' || filters.category === 'event' || filters.category === 'sports')) {
    const fromLower = filters.fromCity.toLowerCase();
    filteredTickets = filteredTickets.filter(ticket => ticket.fromCity?.toLowerCase().includes(fromLower));
  }

  if (filters?.toCity && !(filters.category === 'movie' || filters.category === 'event' || filters.category === 'sports')) {
    const toLower = filters.toCity.toLowerCase();
    filteredTickets = filteredTickets.filter(ticket => ticket.toCity?.toLowerCase().includes(toLower));
  }

  if (filters?.minPrice !== undefined && !(filters.category === 'movie' || filters.category === 'event' || filters.category === 'sports')) {
      filteredTickets = filteredTickets.filter(ticket => ticket.price >= filters!.minPrice!);
  }
  if (filters?.maxPrice !== undefined && !(filters.category === 'movie' || filters.category === 'event' || filters.category === 'sports')) {
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
  return filteredTickets;
}

export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  console.warn("getTicketById is still using localStorage. Refactor for Firestore.");
  const currentMarketplaceTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, []);
  const ticket = currentMarketplaceTickets.find(t => t.id === ticketId);
  return ticket || null;
}

export async function purchaseTicket(ticketId: string): Promise<{ success: boolean; message: string; ticket?: Ticket }> {
  console.warn("purchaseTicket is still using localStorage. Refactor for Firestore.");
  const buyerId = getSimulatedCurrentUserId();
  if (buyerId === 'anonymousUser') {
      return { success: false, message: "User must be logged in to purchase." };
  }

  let currentMarketplaceTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, []);
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

  currentMarketplaceTickets[ticketIndex].status = 'sold';
  saveToLocalStorage(marketplaceTicketsKey, currentMarketplaceTickets);
  addUserOrder(currentMarketplaceTickets[ticketIndex]);

  const updatedTicket = currentMarketplaceTickets[ticketIndex];
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
}

export async function deleteTicket(ticketId: string): Promise<{ success: boolean; message: string }> {
    console.warn("deleteTicket is still using localStorage. Refactor for Firestore.");
    const currentUserId = getSimulatedCurrentUserId();
    if (currentUserId === 'anonymousUser') {
        return { success: false, message: "User must be logged in to delete a ticket." };
    }

    let currentMarketplaceTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, []);
    const ticketIndex = currentMarketplaceTickets.findIndex(ticket => ticket.id === ticketId);

    if (ticketIndex === -1) {
        return { success: false, message: `Ticket ${ticketId} not found in marketplace.` };
    }
    const ticketToDelete = currentMarketplaceTickets[ticketIndex];
    if (ticketToDelete.sellerId !== currentUserId) {
        return { success: false, message: `You are not authorized to delete this ticket.` };
    }

    currentMarketplaceTickets.splice(ticketIndex, 1);
    
    const sellerIsNowVerified = isUserVerifiedByTicketCountInternal(currentUserId, currentMarketplaceTickets);
    currentMarketplaceTickets = currentMarketplaceTickets.map(ticket => {
        if (ticket.sellerId === currentUserId) {
          return { ...ticket, sellerVerified: sellerIsNowVerified };
        }
        return ticket;
    });
    saveToLocalStorage(marketplaceTicketsKey, currentMarketplaceTickets);
    return { success: true, message: `Your ticket listing has been removed.` };
}

// This function would need to query Firestore
export function isUserVerifiedByTicketCount(userId: string): boolean {
  console.warn("isUserVerifiedByTicketCount is still using localStorage. Refactor for Firestore.");
  if (userId === 'anonymousUser') return false;
  const allTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, []);
  const userTicketCount = allTickets.filter(ticket => ticket.sellerId === userId).length;
  return userTicketCount >= 3; // Verified if 3 or more tickets posted
}

// Internal helper, also needs Firestore query if used seriously
function isUserVerifiedByTicketCountInternal(userId: string, tickets: Ticket[]): boolean {
  if (userId === 'anonymousUser') return false;
  const userTicketCount = tickets.filter(ticket => ticket.sellerId === userId).length;
  return userTicketCount >= 3;
}

// This function would also need to query Firestore
export function isUserProfileVerified(userId: string): boolean {
    console.warn("isUserProfileVerified is still using localStorage. Refactor for Firestore.");
    if (userId === 'anonymousUser') return false;
    const allTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, []);
    const userPostedTickets = allTickets.filter(ticket => ticket.sellerId === userId);
    const postedTicketCount = userPostedTickets.length;
    const soldTicketCount = userPostedTickets.filter(ticket => ticket.status === 'sold').length;
    return postedTicketCount >= 3 && soldTicketCount > 0;
}

// --- User Authentication Simulation (Client-side only) ---
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

// Default tickets are not needed if using Firestore as source of truth
// const getDefaultTickets = (): Ticket[] => [ ... ];
// if (typeof window !== 'undefined' && !localStorage.getItem(marketplaceTicketsKey)) {
//     saveToLocalStorage(marketplaceTicketsKey, getDefaultTickets());
// }
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === marketplaceTicketsKey || event.key === userOrdersKey || event.key === userDataKey) {
             console.log(`${event.key} updated from storage event.`);
        }
    });
}
