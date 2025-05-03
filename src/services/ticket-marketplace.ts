/**
 * Represents a ticket for an event or transportation.
 */
export interface Ticket {
  /**
   * The unique identifier for the ticket.
   */
  id: string;
  /**
   * The type of ticket (e.g., train, event, movie, bus).
   */
  type: string;
  /**
   * A description of the ticket.
   */
  description: string;
  /**
   * The price of the ticket.
   */
  price: number;
  /**
   * The date of the event or travel.
   */
  date: string;
  /**
   * The location of the event or departure.
   */
  location: string;
  /**
   * Status of the ticket (e.g., available, sold).
   */
  status?: 'available' | 'sold'; // Optional status field
}

// In-memory store for tickets (replace with actual API/DB calls)
let tickets: Ticket[] = [
  {
    id: '1',
    type: 'train',
    description: 'Train ticket from New York to Boston',
    price: 50,
    date: '2024-08-15', // Updated date to be in the future
    location: 'New York',
    status: 'available',
  },
  {
    id: '2',
    type: 'event',
    description: 'Concert ticket - Rock Band Live',
    price: 75,
    date: '2024-09-22', // Updated date to be in the future
    location: 'Boston Arena',
    status: 'available',
  },
   {
    id: '3',
    type: 'movie',
    description: 'Movie Premiere - Sci-Fi Adventure',
    price: 25,
    date: '2024-08-10', // Updated date to be in the future
    location: 'Downtown Cinema',
    status: 'available',
  },
];


/**
 * Asynchronously retrieves a list of available tickets.
 * Filters out tickets marked as 'sold'.
 *
 * @returns A promise that resolves to an array of available Ticket objects.
 */
export async function getAvailableTickets(): Promise<Ticket[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 50));
  // Return only available tickets
  return tickets.filter(ticket => ticket.status !== 'sold');
}

/**
 * Asynchronously posts a new ticket for sale.
 * Adds the ticket to the in-memory store.
 *
 * @param ticketData The data for the ticket to be posted.
 * @returns A promise that resolves to the created Ticket object.
 */
export async function postTicket(ticketData: Omit<Ticket, 'id' | 'status'>): Promise<Ticket> {
   // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const newTicket: Ticket = {
    ...ticketData,
    id: Math.random().toString(36).substring(2, 15), // Generate a simple random ID
    status: 'available', // New tickets are available by default
  };
  tickets.push(newTicket);
  console.log('Posted Ticket:', newTicket);
  console.log('Current Tickets:', tickets);
  return newTicket;
}


/**
 * Asynchronously simulates purchasing a ticket.
 * Marks the ticket status as 'sold' in the in-memory store.
 *
 * @param ticketId The ID of the ticket to purchase.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function purchaseTicket(ticketId: string): Promise<{ success: boolean; message: string }> {
  // Simulate API call delay (e.g., payment processing)
  await new Promise(resolve => setTimeout(resolve, 300));

  const ticketIndex = tickets.findIndex(ticket => ticket.id === ticketId);

  if (ticketIndex === -1) {
    return { success: false, message: `Ticket with ID ${ticketId} not found.` };
  }

  if (tickets[ticketIndex].status === 'sold') {
    return { success: false, message: `Ticket with ID ${ticketId} is already sold.` };
  }

  // Mark the ticket as sold
  tickets[ticketIndex].status = 'sold';
  console.log(`Ticket ${ticketId} purchased successfully.`);
  console.log('Updated Tickets:', tickets);

  return { success: true, message: `Ticket ${ticketId} purchased successfully!` };
}
