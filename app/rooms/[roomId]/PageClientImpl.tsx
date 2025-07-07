'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { VideoConferenceClientImpl } from '@/app/custom/VideoConferenceClientImpl';
import { PreJoin } from '@livekit/components-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import '../../../styles/livekit-custom.css';

// Define a minimal LocalUserChoices type for now
// You should update this to match your actual usage
interface LocalUserChoices {
  // Add properties as needed
  [key: string]: any;
}

// This file is now the canonical join logic for rooms by id.
// Make sure all navigation and links use /rooms/[roomId] and pass the id, not the name.
// If you are using the [roomId] route, you should remove the [roomName] route to avoid confusion and routing errors.
// This will ensure only /rooms/[roomId] is used for joining rooms.

export default function PageClientImpl(props: {
  roomId: string;
  region?: string;
  hq: boolean;
  codec: 'vp8' | 'h264' | 'vp9' | 'av1';
  onJoin?: () => void;
  onPreJoin?: () => void;
}) {
  const [room, setRoom] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [connectionDetails, setConnectionDetails] = React.useState<any>(null);
  const [preJoinChoices, setPreJoinChoices] = React.useState<any>(null);
  const router = useRouter();
  const { data: session } = useSession();

  React.useEffect(() => {
    async function fetchRoom() {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', props.roomId)
        .single();
      if (error || !data) {
        setError('Room not found.');
        setRoom(null);
        setLoading(false);
        return;
      }
      setRoom(data);
      setError(null);
      setLoading(false);
    }
    fetchRoom();
  }, [props.roomId, props.region]);

  // Fetch connection details only after room is fetched
  React.useEffect(() => {
    if (!room) return;
    async function fetchConnectionDetails() {
      try {
        // Use session user name if available, fallback to random
        const participantName = session?.user?.name || 'user-' + Math.random().toString(36).substring(2, 8);
        const res = await fetch(`/api/connection-details?roomId=${encodeURIComponent(room.id)}&participantName=${encodeURIComponent(participantName)}${props.region ? `&region=${props.region}` : ''}`);
        if (!res.ok) throw new Error('Failed to get connection details');
        const details = await res.json();
        setConnectionDetails(details);
      } catch (e) {
        setError('Could not connect to LiveKit.');
      }
    }
    fetchConnectionDetails();
  }, [room, props.region, session?.user?.name]);

  // Call leave API on tab close (beforeunload) and on route change (popstate)
  React.useEffect(() => {
    const leave = () => {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/room-participants', JSON.stringify({ roomId: props.roomId, action: 'leave' }));
      } else {
        fetch('/api/room-participants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: props.roomId, action: 'leave' }),
          keepalive: true,
        });
      }
    };
    // Handle browser/tab close
    window.addEventListener('beforeunload', leave);
    // Handle browser back/forward navigation
    window.addEventListener('popstate', leave);
    // Next.js router navigation (for client-side route changes)
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') leave();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('beforeunload', leave);
      window.removeEventListener('popstate', leave);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [props.roomId]);

  // Leave handler for UI (button or navigation)
  const handleLeave = async () => {
    await fetch('/api/room-participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: props.roomId, action: 'leave' }),
    });
    router.push('/');
  };

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>Loading room...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</div>;
  if (!room || !connectionDetails) return <div style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>Connecting…</div>;

  if (!preJoinChoices) {
    if (props.onPreJoin) props.onPreJoin();
    return (
      <div className="lkc-prejoin" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40 }}>
        <PreJoin
          defaults={{ username: session?.user?.name || '', videoEnabled: true, audioEnabled: true }}
          onSubmit={(values) => {
            if (props.onJoin) props.onJoin();
            setPreJoinChoices(values);
          }}
          onError={console.error}
        />
        <button
          className="lkc-prejoin-cancel"
          onClick={() => router.push('/')}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <VideoConferenceClientImpl
      liveKitUrl={connectionDetails.serverUrl}
      token={connectionDetails.participantToken}
      roomId={props.roomId}
      codec={props.codec}
    />
  );
}