
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

const marketplaceTicketsKey = 'marketplaceTickets'; // To be fully replaced by Firestore "tickets" collection
const userOrdersKey = 'userOrders'; // To be fully replaced by Firestore "orders" collection
const userDataKey = 'userData'; // User profile data, ideally from Firebase Auth user profile or a 'users' collection

// --- LocalStorage Helper Functions (Still used for some UI aspects temporarily) ---
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

// --- User Orders (still uses localStorage for now, would migrate to Firestore) ---
const getUserOrders = (): Ticket[] => loadFromLocalStorage<Ticket[]>(userOrdersKey, []);
const saveUserOrders = (orders: Ticket[]) => saveToLocalStorage(userOrdersKey, orders);
const addUserOrder = (ticket: Ticket) => saveUserOrders([...getUserOrders(), ticket]);


// --- Ticket Marketplace Service Functions ---

/**
 * Posts a new ticket to Firestore.
 */
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

  // Seller verification logic: Fetch ONLY the seller's tickets to check count
  const userTicketsQuery = query(collection(db, "tickets"), where("sellerId", "==", currentUserId));
  const userTicketsSnapshot = await getDocs(userTicketsQuery);
  const existingUserTicketsCount = userTicketsSnapshot.size;

  // Verification status is met if they already have 2 tickets and are about to post their 3rd (or more).
  const sellerIsNowVerified = (existingUserTicketsCount + 1) >= 3;

  // Sanitize the input data to ensure no `undefined` values are sent to Firestore.
  // This is the critical fix.
  const newTicketDataForFirestore = {
    type: ticketData.type,
    description: ticketData.description,
    price: ticketData.price,
    date: Timestamp.fromDate(new Date(ticketData.date)), // Correctly use the string date
    time: ticketData.time,
    title: ticketData.title || null, // Convert falsy to null
    location: ticketData.location || null, // Convert falsy to null
    fromCity: ticketData.fromCity || null, // Convert falsy to null
    toCity: ticketData.toCity || null, // Convert falsy to null
    originalTicketDataUri: ticketData.originalTicketDataUri || null, // Convert falsy to null
    status: 'available' as const,
    sellerId: currentUserId,
    sellerVerified: sellerIsNowVerified,
    sellerContactEmail: sellerEmail || null,
    sellerContactPhone: sellerPhone || null,
    createdAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, "tickets"), newTicketDataForFirestore);
    console.log("Ticket posted to Firestore with ID: ", docRef.id);

    // If the seller's verification status has changed, update all their existing tickets.
    if (sellerIsNowVerified && userTicketsSnapshot.docs.some(d => d.data().sellerVerified === false)) {
        const batch = writeBatch(db);
        userTicketsSnapshot.forEach((ticketDoc) => {
          const ticketRef = doc(db, "tickets", ticketDoc.id);
          batch.update(ticketRef, { sellerVerified: true });
        });
        await batch.commit();
        console.log(`Updated verification status for seller ${currentUserId}'s tickets.`);
    }
    
    // Construct the returned ticket object from the clean Firestore data
    const finalTicket: Ticket = {
      id: docRef.id,
      type: newTicketDataForFirestore.type,
      description: newTicketDataForFirestore.description,
      price: newTicketDataForFirestore.price,
      date: newTicketDataForFirestore.date, // Use the Timestamp version
      time: newTicketDataForFirestore.time,
      title: newTicketDataForFirestore.title ?? undefined,
      location: newTicketDataForFirestore.location ?? undefined,
      fromCity: newTicketDataForFirestore.fromCity ?? undefined,
      toCity: newTicketDataForFirestore.toCity ?? undefined,
      originalTicketDataUri: newTicketDataForFirestore.originalTicketDataUri ?? undefined,
      status: 'available',
      sellerId: currentUserId,
      sellerVerified: newTicketDataForFirestore.sellerVerified,
      sellerContactEmail: newTicketDataForFirestore.sellerContactEmail ?? undefined,
      sellerContactPhone: newTicketDataForFirestore.sellerContactPhone ?? undefined,
      createdAt: Timestamp.now()
    };

    return finalTicket;

  } catch (error: any) {
    console.error("Error posting ticket to Firestore: ", error);
    if (error.code === 'permission-denied') {
        throw new Error("You do not have permission to post tickets. Please check Firestore rules.");
    }
    throw new Error(`Failed to post ticket to Firestore. ${error.message || 'Unknown error'}`);
  }
}

// --- Functions below use a mix or primarily localStorage and need to be refactored for Firestore ---

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
  location?: string; // Added for event-like location filtering
}): Promise<Ticket[]> {
  // This function should now primarily fetch from Firestore
  console.warn("getAvailableTickets is being refactored for Firestore. Current implementation may be partial.");

  let q = query(collection(db, "tickets"), where("status", "==", "available"));

  if (filters?.ticketId) {
    // This case is tricky if we want to fetch ONLY by ID without status.
    // For now, let's assume if ID is passed, we fetch that specific one, regardless of status (handled by caller if needed).
    // Or, if the intent is to get an *available* ticket by ID:
    // q = query(collection(db, "tickets"), where("id", "==", filters.ticketId), where("status", "==", "available"));
    // However, querying by document ID is direct:
    try {
        const docRef = doc(db, "tickets", filters.ticketId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const ticket = { id: docSnap.id, ...docSnap.data() } as Ticket;
            // If filtering by ID, usually we only expect one, so just return it if found and available (or as needed)
            return ticket.status === 'available' ? [ticket] : [];
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error fetching ticket by ID from Firestore: ", error);
        return [];
    }
  }

  if (filters?.category) {
    if (filters.category === 'transport') {
      q = query(q, where("type", "in", ["train", "bus"]));
    } else if (filters.category !== 'all') {
      q = query(q, where("type", "==", filters.category));
    }
  }

  // Firestore doesn't support case-insensitive 'contains' or OR queries on different fields easily.
  // For searchTerm, you'd typically:
  // 1. Store searchable fields in a dedicated, lowercased array field.
  // 2. Use a third-party search service like Algolia or Typesense.
  // 3. Perform multiple queries and merge results (complex).
  // For this prototype, if searchTerm is present, we might have to do more client-side filtering after a broader fetch,
  // or accept that Firestore search will be limited (e.g., exact match or prefix on one field).
  // The current localStorage-based filtering is more flexible for searchTerm but doesn't apply to Firestore.
  // For now, Firestore part of searchTerm is omitted due to complexity.

  if (filters?.location && (filters.category === 'movie' || filters.category === 'event' || filters.category === 'sports')) {
    // This is also tricky for Firestore "contains". A common pattern is to store location parts in an array.
    // For simplicity, we'll assume location is a direct field to query if needed (e.g., exact city match).
    // q = query(q, where("location", ">=", filters.location.toLowerCase()), where("location", "<=", filters.location.toLowerCase() + '\uf8ff')); // Basic prefix
    // This is not a true "contains". A better approach for "contains" would be a more complex data structure or third-party search.
    // Let's filter this client-side for now if using Firestore.
  }

  if (filters?.fromCity && !(filters.category === 'movie' || filters.category === 'event' || filters.category === 'sports')) {
    q = query(q, where("fromCity", "==", filters.fromCity)); // Assumes exact match for Firestore
  }

  if (filters?.toCity && !(filters.category === 'movie' || filters.category === 'event' || filters.category === 'sports')) {
    q = query(q, where("toCity", "==", filters.toCity)); // Assumes exact match for Firestore
  }

  if (filters?.minPrice !== undefined && !(filters.category === 'movie' || filters.category === 'event' || filters.category === 'sports')) {
      q = query(q, where("price", ">=", filters.minPrice));
  }
  if (filters?.maxPrice !== undefined && !(filters.category === 'movie' || filters.category === 'event' || filters.category === 'sports')) {
      q = query(q, where("price", "<=", filters.maxPrice));
  }

  if (filters?.startDate) {
      q = query(q, where("date", ">=", Timestamp.fromDate(new Date(filters.startDate + 'T00:00:00'))));
  }
  if (filters?.endDate) {
      q = query(q, where("date", "<=", Timestamp.fromDate(new Date(filters.endDate + 'T23:59:59'))));
  }

  let fetchedTickets: Ticket[] = [];
  try {
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      fetchedTickets.push({ id: doc.id, ...doc.data() } as Ticket);
    });
  } catch (error) {
      console.error("Error fetching tickets from Firestore: ", error);
      throw new Error("Failed to fetch tickets from database.");
  }

  // Client-side filtering for searchTerm and event location if not effectively handled by Firestore query
  if (filters?.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    fetchedTickets = fetchedTickets.filter(ticket =>
        (ticket.title && ticket.title.toLowerCase().includes(term)) ||
        ticket.description.toLowerCase().includes(term) ||
        (ticket.location && ticket.location.toLowerCase().includes(term)) ||
        (ticket.fromCity && ticket.fromCity.toLowerCase().includes(term)) ||
        (ticket.toCity && ticket.toCity.toLowerCase().includes(term)) ||
        (ticket.type.toLowerCase().includes(term))
    );
  }
  if (filters?.location && (filters.category === 'movie' || filters.category === 'event' || filters.category === 'sports')) {
    const locationLower = filters.location.toLowerCase();
    // This ensures we apply the location filter for event-like categories if searchTerm didn't already cover it
    // or if the Firestore query for location was too broad/not implemented.
    fetchedTickets = fetchedTickets.filter(ticket => ticket.location?.toLowerCase().includes(locationLower));
  }


  return fetchedTickets;
}

export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  console.warn("getTicketById is being refactored for Firestore.");
  try {
    const docRef = doc(db, "tickets", ticketId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Ticket;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching ticket ${ticketId} from Firestore:`, error);
    return null;
  }
}

export async function purchaseTicket(ticketId: string): Promise<{ success: boolean; message: string; ticket?: Ticket }> {
  console.warn("purchaseTicket is being refactored for Firestore.");
  const buyerId = getSimulatedCurrentUserId();
  if (buyerId === 'anonymousUser') {
      return { success: false, message: "User must be logged in to purchase." };
  }

  const ticketRef = doc(db, "tickets", ticketId);
  try {
    const ticketSnap = await getDoc(ticketRef);
    if (!ticketSnap.exists()) {
      return { success: false, message: `Ticket with ID ${ticketId} not found.` };
    }

    const ticketToUpdate = { id: ticketSnap.id, ...ticketSnap.data() } as Ticket;

    if (ticketToUpdate.status === 'sold') {
      return { success: false, message: `Ticket with ID ${ticketId} is already sold.`, ticket: ticketToUpdate };
    }
    if (ticketToUpdate.sellerId === buyerId) {
        return { success: false, message: `You cannot purchase your own ticket.` };
    }

    await updateDoc(ticketRef, {
      status: 'sold',
      // Potentially add buyerId to the ticket document if needed for history
      // buyerId: buyerId,
      // updatedAt: serverTimestamp() // Firestore automatically updates this if timestamps:true in schema
    });

    const updatedTicketData = { ...ticketToUpdate, status: 'sold' as const };

    // Add to user's orders (still localStorage for this part of the example, would be Firestore collection)
    addUserOrder(updatedTicketData);

    let contactMessage = "Contact the seller ";
      if (updatedTicketData.sellerContactEmail && updatedTicketData.sellerContactPhone) {
          contactMessage += `at ${updatedTicketData.sellerContactEmail} or by phone at ${updatedTicketData.sellerContactPhone}`;
      } else if (updatedTicketData.sellerContactEmail) {
          contactMessage += `at ${updatedTicketData.sellerContactEmail}`;
      } else if (updatedTicketData.sellerContactPhone) {
          contactMessage += `by phone at ${updatedTicketData.sellerContactPhone}`;
      } else {
          contactMessage += "using their listed contact details";
      }
    contactMessage += " to complete your purchase.";
    return { success: true, message: `Ticket ${ticketId} purchase initiated! ${contactMessage}`, ticket: updatedTicketData };

  } catch (error: any) {
    console.error("Error purchasing ticket from Firestore: ", error);
    if (error.code === 'permission-denied') {
        throw new Error("You do not have permission to purchase tickets. Please check Firestore rules.");
    }
    throw new Error(`Failed to purchase ticket from Firestore. ${error.message || 'Unknown error'}`);
  }
}

export async function deleteTicket(ticketId: string): Promise<{ success: boolean; message: string }> {
    console.warn("deleteTicket is being refactored for Firestore.");
    const currentUserId = getSimulatedCurrentUserId();
    if (currentUserId === 'anonymousUser') {
        // This check should ideally happen before calling the service,
        // but it's good to have it here too for direct service calls.
        throw new Error("User must be logged in to delete a ticket.");
    }

    const ticketRef = doc(db, "tickets", ticketId);
    try {
        const ticketSnap = await getDoc(ticketRef);
        if (!ticketSnap.exists()) {
            return { success: false, message: `Ticket ${ticketId} not found.` };
        }
        const ticketData = ticketSnap.data();
        if (ticketData.sellerId !== currentUserId) {
            return { success: false, message: `You are not authorized to delete this ticket.` };
        }

        await deleteDoc(ticketRef);
        console.log(`Ticket ${ticketId} deleted from Firestore.`);

        // After deleting, re-evaluate and update verification status for remaining tickets of this seller
        const remainingUserTicketsQuery = query(collection(db, "tickets"), where("sellerId", "==", currentUserId));
        const remainingUserTicketsSnapshot = await getDocs(remainingUserTicketsQuery);
        
        // After deletion, the new count determines the verification status.
        const sellerIsStillVerified = remainingUserTicketsSnapshot.size >= 3;

        // If their status has now dropped to unverified, update all remaining tickets.
        if (!sellerIsStillVerified && remainingUserTicketsSnapshot.docs.some(d => d.data().sellerVerified === true)) {
            const batch = writeBatch(db);
            remainingUserTicketsSnapshot.forEach((ticketDoc) => {
                const specificTicketRef = doc(db, "tickets", ticketDoc.id);
                batch.update(specificTicketRef, { sellerVerified: false });
            });
            await batch.commit();
            console.log(`Updated verification status for seller ${currentUserId}'s remaining tickets to NOT VERIFIED.`);
        }

        return { success: true, message: `Your ticket listing has been removed.` };

    } catch (error: any) {
        console.error("Error deleting ticket from Firestore: ", error);
        if (error.code === 'permission-denied') {
            throw new Error("You do not have permission to delete this ticket. Please check Firestore rules.");
        }
        throw new Error(`Failed to delete ticket from Firestore. ${error.message || 'Unknown error'}`);
    }
}


// --- Verification Logic (Requires Firestore queries) ---

// Internal helper to check verification based on a provided list of tickets (e.g., including one about to be posted)
function isUserVerifiedByTicketCountInternal(userId: string, tickets: Ticket[]): boolean {
  if (userId === 'anonymousUser') return false;
  const userTicketCount = tickets.filter(ticket => ticket.sellerId === userId).length;
  return userTicketCount >= 3;
}

// Public function to check verification status by querying Firestore
export function isUserVerifiedByTicketCount(userId: string): boolean {
    if (userId === 'anonymousUser') return false;

    // This function is now synchronous and relies on localStorage for the demo.
    // A real implementation would need to be async and query Firestore.
    // We are simulating this based on the seller's *currently* posted tickets in localStorage
    // for the purpose of the UI badge, which may not be 100% in sync with Firestore
    // without a real-time listener.
    const allTickets = loadFromLocalStorage<Ticket[]>(marketplaceTicketsKey, []);
    return isUserVerifiedByTicketCountInternal(userId, allTickets);
}

export async function isUserProfileVerified(userId: string): Promise<boolean> {
    if (userId === 'anonymousUser') return false;
    try {
        const postedTicketsQuery = query(collection(db, "tickets"), where("sellerId", "==", userId));
        const postedTicketsSnapshot = await getDocs(postedTicketsQuery);
        const postedTicketCount = postedTicketsSnapshot.size;

        if (postedTicketCount < 3) return false;

        const soldTicketsQuery = query(collection(db, "tickets"), where("sellerId", "==", userId), where("status", "==", "sold"));
        const soldTicketsSnapshot = await getDocs(soldTicketsQuery);
        const soldTicketCount = soldTicketsSnapshot.size;

        return soldTicketCount > 0;
    } catch (error) {
        console.error("Error checking user profile verification from Firestore:", error);
        return false;
    }
}


// --- User Authentication Simulation (Client-side only) ---
// This needs to be replaced with Firebase Authentication for a real app.
export function getSimulatedCurrentUserId(): string {
    if (typeof window !== 'undefined') {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userId = localStorage.getItem('userId'); // User's email/phone used as ID
        if (isLoggedIn && userId) {
            return userId;
        }
    }
    return 'anonymousUser';
}

// Default tickets are used if localStorage is empty.
// This part would be removed or changed if data is solely from Firestore.
const getDefaultTickets = (): Ticket[] => {
  const verifiedSellerAmongDefaults = "verifiedSeller@example.com"; // Example ID for a verified default seller

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

// Initialize localStorage with default tickets if it's empty (for prototype)
// This will be less relevant once all reads are from Firestore.
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
