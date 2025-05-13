
import { NextRequest, NextResponse } from 'next/server';
import { purchaseTicket, getSimulatedCurrentUserId } from '@/services/ticket-marketplace';

export async function POST(request: NextRequest) {
  try {
    const { ticketId } = await request.json();

    if (!ticketId) {
      return NextResponse.json({ message: 'Ticket ID is required' }, { status: 400 });
    }

    const buyerId = getSimulatedCurrentUserId(); // Simulate getting buyer ID
    if (buyerId === 'anonymousUser') {
        return NextResponse.json({ message: 'User must be logged in to purchase' }, { status: 401 });
    }

    const result = await purchaseTicket(ticketId); // purchaseTicket internally handles seller check & localStorage updates

    if (result.success && result.ticket) {
      return NextResponse.json({ success: true, message: result.message, ticket: result.ticket }, { status: 200 });
    } else {
      // Determine appropriate status code
      let statusCode = 400;
      if (result.message.includes('not found')) statusCode = 404;
      if (result.message.includes('already sold')) statusCode = 409; // Conflict
      if (result.message.includes('purchase your own')) statusCode = 403; // Forbidden
      return NextResponse.json({ success: false, message: result.message, ticket: result.ticket }, { status: statusCode });
    }
  } catch (error: any) {
    console.error('Error purchasing ticket:', error);
    return NextResponse.json({ success: false, message: 'Failed to purchase ticket', error: error.message }, { status: 500 });
  }
}
