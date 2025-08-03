
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, Timestamp, serverTimestamp, writeBatch, getDoc, documentId,getCountFromServer } from "firebase/firestore";

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
  title?: string | null;
  /**
   * A description of the ticket.
   */
  description: string;
  /**
   * The price of the ticket.
   */
  price: number;
  /**
   * The date of the event or travel. Stored as a Firestore Timestamp.
   */
  date: Timestamp;
  /**
   * The time of the event or travel (HH:MM).
   */
  time: string;
  /**
   * The location/venue, mainly for events/movies/sports. Can also hold platform/gate info for transport.
   */
  location?: string | null;
   /**
   * The departure city, mainly for train/bus.
   */
  fromCity?: string | null;
  /**
   * The destination city, mainly for train/bus.
   */
  toCity?: string | null;
  /**
   * Status of the ticket (e.g., available, sold).
   */
  status?: 'available' | 'sold';
  /**
   * Optional data URI of the uploaded original ticket image/file.
   */
  originalTicketDataUri?: string | null;
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
   sellerContactEmail?: string | null;
   /**
    * The contact phone number of the seller.
    */
   sellerContactPhone?: string | null;
   /**
    * Timestamp of when the ticket was created.
    */
   createdAt?: Timestamp;
}

interface UserData {
  name: string;
  email: string;
  contact: string;
  gender: 'male' | 'female' | 'other' | string;
}

const ticketsCollection = collection(db, "tickets");

// --- Firestore-based Service Functions ---

export async function postTicket(
  ticketData: Omit<Ticket, 'id' | 'status' | 'sellerId' | 'sellerVerified' | 'sellerContactEmail' | 'sellerContactPhone' | 'createdAt' | 'date'> & { date: string }
): Promise<Ticket> {
  const currentUserId = getSimulatedCurrentUserId();
  if (currentUserId === 'anonymousUser') {
    throw new Error("User must be logged in to post a ticket.");
  }

  // Fetch seller contact details from localStorage (as part of user profile simulation)
  let sellerEmail: string | undefined = undefined;
  let sellerPhone: string | undefined = undefined;
  if (typeof window !== 'undefined') {
    const storedUserData = localStorage.getItem('userData');
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

  // Check if seller will be verified with this new ticket
  const sellerIsVerified = await isUserVerifiedByTicketCountInternal(currentUserId, true);

  const ticketToCreate = {
    ...ticketData,
    date: Timestamp.fromDate(new Date(ticketData.date)),
    status: 'available' as const,
    sellerId: currentUserId,
    sellerVerified: sellerIsVerified,
    sellerContactEmail: sellerEmail || null,
    sellerContactPhone: sellerPhone || null,
    createdAt: serverTimestamp(),
    title: ticketData.title || null,
    location: ticketData.location || null,
    fromCity: ticketData.fromCity || null,
    toCity: ticketData.toCity || null,
    originalTicketDataUri: ticketData.originalTicketDataUri || null,
  };

  const docRef = await addDoc(ticketsCollection, ticketToCreate);

  // If seller became verified, update all their previous tickets
  if (sellerIsVerified) {
    const q = query(ticketsCollection, where("sellerId", "==", currentUserId));
    const userTicketsSnapshot = await getDocs(q);
    const batch = writeBatch(db);
    userTicketsSnapshot.forEach((ticketDoc) => {
      if (ticketDoc.data().sellerVerified !== true) {
        batch.update(ticketDoc.ref, { sellerVerified: true });
      }
    });
    await batch.commit();
  }

  return { id: docRef.id, ...ticketToCreate } as Ticket; // Type assertion needed as serverTimestamp is resolved by server
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
  location?: string;
}): Promise<Ticket[]> {
  let q = query(ticketsCollection, where("status", "==", "available"));

  if (filters) {
    if (filters.category && filters.category !== 'all') {
      if (filters.category === 'transport') {
        q = query(q, where("type", "in", ["train", "bus"]));
      } else {
        q = query(q, where("type", "==", filters.category));
      }
    }
    if (filters.fromCity) q = query(q, where("fromCity", "==", filters.fromCity));
    if (filters.toCity) q = query(q, where("toCity", "==", filters.toCity));
    if (filters.minPrice !== undefined) q = query(q, where("price", ">=", filters.minPrice));
    if (filters.maxPrice !== undefined) q = query(q, where("price", "<=", filters.maxPrice));
    if (filters.startDate) q = query(q, where("date", ">=", Timestamp.fromDate(new Date(filters.startDate))));
    if (filters.endDate) q = query(q, where("date", "<=", Timestamp.fromDate(new Date(filters.endDate))));
    if (filters.location) q = query(q, where("location", ">=", filters.location), where("location", "<=", filters.location + '\uf8ff'));
    
    // Note: Firestore does not support full-text search out of the box.
    // A simple "searchTerm" filter would require a more complex setup (e.g., Algolia, or structuring data differently).
    // The current filter logic will be basic. A more robust search would be a separate feature.
  }

  const snapshot = await getDocs(q);
  const tickets: Ticket[] = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Ticket));
  
  // Client-side filtering for searchTerm as a workaround
  if (filters?.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    return tickets.filter(ticket => 
        (ticket.title?.toLowerCase().includes(term)) ||
        (ticket.description.toLowerCase().includes(term)) ||
        (ticket.fromCity?.toLowerCase().includes(term)) ||
        (ticket.toCity?.toLowerCase().includes(term)) ||
        (ticket.location?.toLowerCase().includes(term)) ||
        (ticket.type.toLowerCase().includes(term))
    );
  }

  return tickets;
}

export async function getTicketById(ticketId: string): Promise<Ticket | null> {
    if (!ticketId) return null;
    const docRef = doc(db, "tickets", ticketId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Ticket;
    } else {
        return null;
    }
}

export async function purchaseTicket(ticketId: string): Promise<{ success: boolean; message: string; ticket?: Ticket }> {
  const buyerId = getSimulatedCurrentUserId();
  if (buyerId === 'anonymousUser') {
    return { success: false, message: "User must be logged in to purchase." };
  }

  const ticketRef = doc(db, "tickets", ticketId);
  
  try {
    const ticketDoc = await getDoc(ticketRef);
    if (!ticketDoc.exists()) {
      return { success: false, message: `Ticket with ID ${ticketId} not found.` };
    }

    const ticketData = ticketDoc.data() as Ticket;

    if (ticketData.status === 'sold') {
      return { success: false, message: `Ticket with ID ${ticketId} is already sold.`, ticket: ticketData };
    }
    if (ticketData.sellerId === buyerId) {
      return { success: false, message: `You cannot purchase your own ticket.` };
    }
    
    await updateDoc(ticketRef, { status: 'sold' });

    // Simulate adding to user's orders in localStorage
    if (typeof window !== 'undefined') {
        const userOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
        userOrders.push({ id: ticketId, ...ticketData });
        localStorage.setItem('userOrders', JSON.stringify(userOrders));
    }
    
    const updatedTicket = { ...ticketData, id: ticketId, status: 'sold' as const };
    return { success: true, message: `Ticket ${ticketId} purchase initiated!`, ticket: updatedTicket };
    
  } catch (error: any) {
    console.error("Error purchasing ticket:", error);
    return { success: false, message: error.message || 'An error occurred during purchase.' };
  }
}

export async function deleteTicket(ticketId: string): Promise<{ success: boolean; message: string }> {
  const currentUserId = getSimulatedCurrentUserId();
  if (currentUserId === 'anonymousUser') {
    throw new Error("User must be logged in to delete a ticket.");
  }

  const ticketRef = doc(db, "tickets", ticketId);
  const ticketDoc = await getDoc(ticketRef);

  if (!ticketDoc.exists()) {
    return { success: false, message: `Ticket ${ticketId} not found.` };
  }

  if (ticketDoc.data().sellerId !== currentUserId) {
    return { success: false, message: `You are not authorized to delete this ticket.` };
  }

  await deleteDoc(ticketRef);
  return { success: true, message: `Your ticket listing has been removed.` };
}

async function isUserVerifiedByTicketCountInternal(userId: string, isPostingNew: boolean): Promise<boolean> {
  if (userId === 'anonymousUser') return false;
  const q = query(ticketsCollection, where("sellerId", "==", userId));
  const snapshot = await getCountFromServer(q);
  const count = snapshot.data().count;
  // If user is posting a new ticket, their count will be `count + 1`
  // We check if their count will be >= 3.
  const threshold = 3;
  return isPostingNew ? (count + 1) >= threshold : count >= threshold;
}

export async function isUserVerifiedByTicketCount(userId: string): Promise<boolean> {
    return isUserVerifiedByTicketCountInternal(userId, false);
}

// This function still relies on localStorage as user profile is not in Firestore yet.
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
