
import { NextRequest, NextResponse } from 'next/server';
import { getTicketById, deleteTicket as deleteTicketService } from '@/services/ticket-marketplace';

interface Params {
  params: {
    ticketId: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  const { ticketId } = params;
  try {
    const ticket = await getTicketById(ticketId);
    if (ticket) {
      return NextResponse.json(ticket);
    } else {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Error fetching ticket ${ticketId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch ticket' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { ticketId } = params;
  // In a real app, you'd get the userId from an authenticated session
  // const userId = getUserIdFromSession(request); // Placeholder
  // For simulation, we'll rely on the service function to check sellerId if needed

  try {
    const result = await deleteTicketService(ticketId);
    if (result.success) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    } else {
      // Determine appropriate status code based on failure reason
      const statusCode = result.message.includes('authorized') ? 403 : result.message.includes('not found') ? 404 : 400;
      return NextResponse.json({ message: result.message }, { status: statusCode });
    }
  } catch (error) {
    console.error(`Error deleting ticket ${ticketId}:`, error);
    return NextResponse.json({ message: 'Failed to delete ticket' }, { status: 500 });
  }
}
