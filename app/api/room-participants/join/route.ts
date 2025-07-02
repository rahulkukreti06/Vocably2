import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Type declaration for global participant counts
declare global {
  var participantCounts: { [roomId: string]: number };
}

// Initialize participant counts
let participantCounts = global.participantCounts || {};
if (!global.participantCounts) {
  global.participantCounts = participantCounts;
}

// Function to broadcast counts to WebSocket clients
function broadcastParticipantCounts() {
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

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const roomId = data.roomId;
    if (!roomId) return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    participantCounts[roomId] = (participantCounts[roomId] || 0) + 1;
    // Update Supabase participants column and log result
    const { data: updateData, error: updateError } = await supabase.from('rooms').update({ participants: participantCounts[roomId] }).eq('id', roomId);
    console.log('Supabase update result (join):', { updateData, updateError });
    broadcastParticipantCounts();
    console.log('JOIN API:', { roomId, after: participantCounts[roomId] });
    return NextResponse.json({ roomId, count: participantCounts[roomId] });
  } catch (error) {
    console.error('Error in join route:', error);
    return NextResponse.json({ error: 'Failed to process join request' }, { status: 500 });
  }
}