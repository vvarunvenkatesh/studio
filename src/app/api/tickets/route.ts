
import { NextRequest, NextResponse } from 'next/server';
import { getAvailableTickets, postTicket, Ticket } from '@/services/ticket-marketplace';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') as Ticket['type'] | null;
  const fromCity = searchParams.get('from') || undefined;
  const toCity = searchParams.get('to') || undefined;
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
  const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;

  const filters: any = {};
  if (category && category !== 'all') filters.category = category;
  if (fromCity) filters.fromCity = fromCity;
  if (toCity) filters.toCity = toCity;
  if (minPrice !== undefined && !isNaN(minPrice)) filters.minPrice = minPrice;
  if (maxPrice !== undefined && !isNaN(maxPrice)) filters.maxPrice = maxPrice;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  try {
    const tickets = await getAvailableTickets(filters);
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ message: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ticketData = await request.json();
    // Basic validation (can be more extensive with Zod or similar)
    if (!ticketData.type || !ticketData.description || !ticketData.price || !ticketData.date || !ticketData.time) {
      return NextResponse.json({ message: 'Missing required ticket fields' }, { status: 400 });
    }
    const newTicket = await postTicket(ticketData);
    return NextResponse.json(newTicket, { status: 201 });
  } catch (error: any) {
    console.error('Error posting ticket:', error);
    if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
        return NextResponse.json({ message: 'Storage limit reached. Could not post ticket.' }, { status: 507 });
    }
    return NextResponse.json({ message: 'Failed to post ticket', error: error.message }, { status: 500 });
  }
}
