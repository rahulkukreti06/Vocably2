require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const wss = new WebSocket.Server({ port: 3001 });

// In-memory participant counts (shared with API via global)
const participantCounts = global.participantCounts = global.participantCounts || {};

function broadcastCounts() {
  const message = JSON.stringify({ type: 'counts', rooms: participantCounts });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', ws => {
  // Send current counts on connect
  ws.send(JSON.stringify({ type: 'counts', rooms: participantCounts }));

  // Listen for a message from the client specifying the roomId
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data && data.roomId) {
        ws.roomId = data.roomId;
      }
    } catch (e) {
      // Ignore malformed messages
    }
  });
});

// Expose a function for the API to call when counts change
if (!global.broadcastParticipantCounts) {
  global.broadcastParticipantCounts = broadcastCounts;
}

// Track scheduled deletions for empty rooms
const scheduledDeletions = {};

function scheduleRoomDeletion(roomId) {
  if (scheduledDeletions[roomId]) return; // Already scheduled
  scheduledDeletions[roomId] = setTimeout(async () => {
    // Double-check count is still zero before deleting
    if (participantCounts[roomId] === 0) {
      try {
        await supabase.from('rooms').delete().eq('id', roomId);
        delete participantCounts[roomId];
        broadcastCounts();
        console.log(`Room ${roomId} deleted after 5 minutes of inactivity.`);
      } catch (e) {
        console.error('Failed to delete empty room:', e);
      }
    }
    delete scheduledDeletions[roomId];
  }, 5 * 60 * 1000); // 5 minutes
}

function cancelRoomDeletion(roomId) {
  if (scheduledDeletions[roomId]) {
    clearTimeout(scheduledDeletions[roomId]);
    delete scheduledDeletions[roomId];
  }
}

// Periodically reset counts for rooms with no active clients
setInterval(async function cleanupParticipantCounts() {
  for (const roomId in participantCounts) {
    const hasClient = Array.from(wss.clients).some(client => client.readyState === WebSocket.OPEN && client.roomId === roomId);
    if (!hasClient && participantCounts[roomId] !== 0) {
      participantCounts[roomId] = 0;
      // Update Supabase as well
      try {
        await supabase.from('rooms').update({ participants: 0 }).eq('id', roomId);
      } catch (e) {
        console.error('Failed to reset count in Supabase:', e);
      }
      broadcastCounts();
    }
    // Schedule deletion if count is zero
    if (!hasClient && participantCounts[roomId] === 0) {
      scheduleRoomDeletion(roomId);
    } else {
      cancelRoomDeletion(roomId);
    }
  }
}, 60000); // Run every 60 seconds

console.log('WebSocket server running on ws://localhost:3001');