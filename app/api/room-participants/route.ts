import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Adjust the import based on your project structure

// Initialize participant counts
let participantCounts = global.participantCounts || {};
if (!global.participantCounts) {
  global.participantCounts = participantCounts;
}

// Add type declaration for globalThis.broadcastParticipantCounts
declare global {
  // eslint-disable-next-line no-var
  var broadcastParticipantCounts: (() => void) | undefined;
}

// Function to broadcast counts to WebSocket clients (server-side)
function broadcastParticipantCounts() {
  if (typeof globalThis.broadcastParticipantCounts === 'function') {
    globalThis.broadcastParticipantCounts();
    return;
  }
  const message = JSON.stringify({ type: 'counts', rooms: participantCounts });
  if (typeof window === 'undefined') {
    // Server-side: Send to WebSocket server
    const WebSocket = require('ws');
    const client = new WebSocket('ws://localhost:3001');
    
    client.on('open', () => {
      client.send(message);
      client.close();
    });

    client.on('error', (error: unknown) => {
      console.error('WebSocket error:', error);
    });

    client.on('close', () => {
      console.log('WebSocket connection closed');
    });
  }
}

export async function GET() {
  return NextResponse.json({ rooms: participantCounts });
}

export async function POST(request: Request) {
  const { roomId, action } = await request.json();
  console.log('JOIN API called with:', { roomId, action });
  
  if (!roomId || !action) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    // Debug: print current participantCounts object
    console.log('Current participantCounts:', participantCounts);
    // Update counts based on action
    if (action === 'join') {
      participantCounts[roomId] = (participantCounts[roomId] || 0) + 1;
      console.log(`Joined room: ${roomId}, new count: ${participantCounts[roomId]}`);
    } else if (action === 'leave') {
      participantCounts[roomId] = Math.max(0, (participantCounts[roomId] || 0) - 1);
      console.log(`Left room: ${roomId}, new count: ${participantCounts[roomId]}`);
    }

    // Update the participants column in Supabase
    const { data: updateData, error: updateError } = await supabase
      .from('rooms')
      .update({ participants: participantCounts[roomId] })
      .eq('id', roomId);
    if (updateError) {
      console.error('Supabase update error:', updateError);
    }

    // Broadcast the update to all WebSocket clients
    broadcastParticipantCounts();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating participant count:', error);
    return NextResponse.json({ error: 'Failed to update participant count' }, { status: 500 });
  }
}
