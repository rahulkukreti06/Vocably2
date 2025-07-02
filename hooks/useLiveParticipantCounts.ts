import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useLiveParticipantCounts(rooms: { id: string }[]) {
  const [counts, setCounts] = useState<{ [roomId: string]: number }>({});
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!rooms || rooms.length === 0) return;
    let subscription: any;
    let ws: WebSocket | null = null;
    let wsActive = false;
    let pollInterval: NodeJS.Timeout | null = null;

    // WebSocket real-time updates
    function setupWebSocket() {
      ws = new window.WebSocket('ws://localhost:3001');
      wsRef.current = ws;
      ws.onopen = () => {
        wsActive = true;
        console.log('[useLiveParticipantCounts] WebSocket connected');
      };
      ws.onmessage = (event) => {
        console.log('[useLiveParticipantCounts] WebSocket message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'counts' && data.rooms) {
            console.log('[useLiveParticipantCounts] Received counts update:', data.rooms);
            setCounts((prev) => ({ ...prev, ...data.rooms }));
          }
        } catch (err) {
          console.error('[useLiveParticipantCounts] Error parsing WebSocket message:', err);
        }
      };
      ws.onclose = () => {
        wsActive = false;
        console.log('[useLiveParticipantCounts] WebSocket disconnected, retrying...');
        setTimeout(setupWebSocket, 2000);
      };
      ws.onerror = (err) => {
        console.error('[useLiveParticipantCounts] WebSocket error:', err);
      };
    }
    setupWebSocket();

    // Fallback: also subscribe to Supabase for DB sync
    async function fetchCounts() {
      const { data, error } = await supabase
        .from('rooms')
        .select('id,participants');
      if (!error && data) {
        const countsObj: { [roomId: string]: number } = {};
        data.forEach((room: any) => {
          countsObj[room.id] = room.participants;
        });
        setCounts(countsObj);
      }
    }
    fetchCounts();
    subscription = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchCounts();
      })
      .subscribe();

    // Poll every 5 seconds
    pollInterval = setInterval(fetchCounts, 5000);

    return () => {
      if (subscription) supabase.removeChannel(subscription);
      if (wsRef.current) wsRef.current.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [rooms]);

  return counts;
}
