'use client';

import React, { useEffect, useState } from 'react';
import { FaUser, FaLock, FaComments, FaFilter } from 'react-icons/fa';
import { Header, SearchBar } from '../components/Header';
import { RoomList } from '../components/RoomList';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { UserProfile } from '../components/UserProfile';
import RoomCard from '../components/RoomCard';
import JoinRoomModal from '../components/JoinRoomModal';
import { useRouter } from 'next/navigation';
import { useLiveParticipantCounts } from '../hooks/useLiveParticipantCounts';
import BuyMeCoffee from '../components/BuyMeCoffee';
import { supabase } from '@/lib/supabaseClient';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ChevronDown } from "lucide-react";
import dynamic from 'next/dynamic';

const ScrollToTopBottomButton = dynamic(() => import('../components/ScrollToTopBottomButton'), { ssr: false });

interface Room {
  id: string;
  name: string;
  created_at: string; // changed from number to string (ISO)
  participants: number;
  max_participants: number;
  language: string;
  language_level: 'beginner' | 'intermediate' | 'advanced';
  is_public: boolean;
  password?: string;
  created_by: string;
  created_by_name?: string; // Make optional for compatibility
  topic?: string;
  tags?: string[];
}

// Custom hook for media query
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}

export default function Page() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState<Room | null>(null);
  const [isJoiningMap, setIsJoiningMap] = useState<{ [roomId: string]: boolean }>({});
  const [joinPasswordError, setJoinPasswordError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'alphabetical'>('newest');
  const [roomType, setRoomType] = useState<'all' | 'public' | 'private'>('all');
  const [availability, setAvailability] = useState<'all' | 'available' | 'full'>('all');

  const router = useRouter();
  const participantCounts = useLiveParticipantCounts(rooms);
  const isMobile = useMediaQuery('(max-width: 640px)');
  const { data: session } = useSession();

  // Custom error modal for sign-in required
  const [showSignInError, setShowSignInError] = useState(false);
  const [signInErrorMessage, setSignInErrorMessage] = useState('');

  const showSignInModal = (message: string) => {
    setSignInErrorMessage(message);
    setShowSignInError(true);
  };

  // Fetch rooms from Supabase and subscribe to real-time changes
  useEffect(() => {
    let subscription: any;
    async function fetchRooms() {
      setRoomsLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });
      console.log('Supabase fetchRooms result:', { data, error }); // <-- log result
      if (!error && data) {
        setRooms(data);
      }
      setRoomsLoading(false);
    }
    fetchRooms();
    // Subscribe to real-time changes
    subscription = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (payload) => {
        fetchRooms();
      })
      .subscribe();
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  const handleJoinRoom = async (room: Room) => {
    if (!session || !session.user) {
      showSignInModal('You must be signed in to join or create a room. Please sign in with your Google account to continue.');
      return;
    }
    setIsJoiningMap(prev => ({ ...prev, [room.id]: true }));
    // Use real participant count
    const realCount = participantCounts[room.id] ?? room.participants;
    if (!room.is_public) {
      // Only show join modal if password is set (not empty)
      if (room.password && room.password.length > 0) {
        setJoiningRoom(room);
        setShowJoinModal(true);
        setJoinPasswordError(null);
        setIsJoiningMap(prev => ({ ...prev, [room.id]: false }));
        return;
      } else {
        // If private but no password, allow join directly
        if (realCount >= room.max_participants) {
          alert('Room is full!');
          setIsJoiningMap(prev => ({ ...prev, [room.id]: false }));
          return;
        }
        try {
          await fetch('/api/room-participants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: room.id, action: 'join' }),
          });
          router.push(`/rooms/${room.id}`); // Removed setTimeout for instant navigation
        } catch (err) {
          alert('Failed to join the room.');
          console.error(err);
        } finally {
          setIsJoiningMap(prev => ({ ...prev, [room.id]: false }));
        }
        return;
      }
    }
    // Public room: join instantly
    if (realCount >= room.max_participants) {
      alert('Room is full!');
      setIsJoiningMap(prev => ({ ...prev, [room.id]: false }));
      return;
    }
    // Call backend to increment participant count
    try {
      await fetch('/api/room-participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, action: 'join' }),
      });
      router.push(`/rooms/${room.id}`); // Removed setTimeout for instant navigation
    } catch (err) {
      alert('Failed to join the room.');
      console.error(err);
    } finally {
      setIsJoiningMap(prev => ({ ...prev, [room.id]: false }));
    }
  };

  // Update handleModalJoin to use per-room isJoiningMap
  const handleModalJoin = async (password?: string) => {
    if (!joiningRoom) return;
    setIsJoiningMap(prev => ({ ...prev, [joiningRoom.id]: true }));
    let passwordIncorrect = false;
    try {
      if (!joiningRoom.is_public && joiningRoom.password && joiningRoom.password !== password) {
        setJoinPasswordError('Incorrect password');
        setIsJoiningMap(prev => ({ ...prev, [joiningRoom.id]: false }));
        passwordIncorrect = true;
        return;
      }
      const realCount = participantCounts[joiningRoom.id] ?? joiningRoom.participants;
      if (realCount >= joiningRoom.max_participants) {
        alert('Room is full!');
      } else {
        router.push(`/rooms/${joiningRoom.id}`);
      }
    } catch (err) {
      alert('An error occurred while joining the room.');
      console.error(err);
    } finally {
      if (!passwordIncorrect) {
        setIsJoiningMap(prev => ({ ...prev, [joiningRoom.id]: false }));
        setShowJoinModal(false);
        setJoiningRoom(null);
        setJoinPasswordError(null);
      }
    }
  };

  const handleModalCancel = () => {
    setShowJoinModal(false);
    setJoiningRoom(null);
    setJoinPasswordError(null);
    if (joiningRoom) setIsJoiningMap(prev => ({ ...prev, [joiningRoom.id]: false }));
  };

  const handleCreateRoom = async (roomData: {
    name: string;
    language: string;
    language_level: 'beginner' | 'intermediate' | 'advanced';
    isPublic: boolean;
    password?: string;
    maxParticipants: number;
    topic?: string;
    tags: string[];
  }) => {
    if (!session || !session.user) {
      showSignInModal('You must be signed in to create a room. Please sign in with your Google account to continue.');
      return;
    }
    if (!session.user.id) {
      showSignInModal('You must be signed in to create a room. Please sign in with your Google account to continue.');
      return;
    }
    // Use only a real UUID for created_by
    let created_by = String(session.user.id).trim();
    
    const newRoom: Room = {
      id: crypto.randomUUID(),
      name: roomData.name,
      created_at: new Date().toISOString(), // Use ISO string for SQL timestamp
      participants: 0,
      max_participants: roomData.maxParticipants,
      language: roomData.language,
      language_level: roomData.language_level,
      is_public: roomData.isPublic,
      password: roomData.password ?? '', // default to empty string
      created_by: created_by, // always a UUID
      created_by_name: session.user.name || '', // store real name
      topic: roomData.topic ?? '',       // default to empty string
      tags: roomData.tags ?? [],         // default to empty array
    };
    // Debug: log the newRoom object before inserting
    console.log('Creating new room:', newRoom);
    // Log the Supabase key being used
    console.log('Supabase key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    // Final fallback for created_by (should always be a UUID or a valid provider user ID)
    if (!newRoom.created_by || typeof newRoom.created_by !== 'string' || newRoom.created_by.length < 6) {
      showSignInModal('You must be signed in with a valid account to create a room. Please sign in with your Google account to continue.');
      return;
    }
    console.log('Final newRoom object before insert:', newRoom);
    // Debug: log the newRoom object and created_by before inserting
    console.log('DEBUG: About to insert newRoom:', newRoom);
    console.log('DEBUG: newRoom.created_by value:', newRoom.created_by);

    // Minimal insert for debugging
    const minimalRoom = {
      id: newRoom.id,
      name: newRoom.name,
      created_at: newRoom.created_at, // now ISO string
      participants: newRoom.participants,
      max_participants: newRoom.max_participants,
      language: newRoom.language,
      language_level: newRoom.language_level,
      is_public: newRoom.is_public,
      password: newRoom.password, // <-- ensure password is included
      created_by: newRoom.created_by,
      created_by_name: newRoom.created_by_name,
      topic: newRoom.topic, // <-- ensure topic is included
    };
    console.log('DEBUG: Minimal insert payload:', minimalRoom);
    const { data, error } = await supabase.from('rooms').insert([minimalRoom]);
    console.log('Supabase insert result:', { data, error });
    if (error) {
      alert('Failed to create room: ' + error.message + '\n' + JSON.stringify(error, null, 2));
      return;
    }
    setShowCreateModal(false);
    setRooms(prevRooms => [newRoom, ...prevRooms]);
  };

  // Merge real participant counts into rooms for display
  const roomsWithRealCounts = rooms.map(room => ({
    ...room,
    participants: typeof participantCounts[room.id] === 'number'
      ? participantCounts[room.id]
      : 0,
    created_by_name: room.created_by_name || '', // always a string
  }));

  // Debug: log participantCounts and roomsWithRealCounts
  React.useEffect(() => {
    console.log('participantCounts:', participantCounts);
    console.log('roomsWithRealCounts:', roomsWithRealCounts);
  }, [participantCounts, roomsWithRealCounts]);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
      const listener = () => {
        setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      };
      window.addEventListener('storage', listener);
      return () => window.removeEventListener('storage', listener);
    }
  }, []);

  const handleJoinRoomSync = (room: Room) => {
    // Just call the async handler, but don't await (RoomList expects sync)
    handleJoinRoom(room);
  };

  const [mobileProfileMenuOpen, setMobileProfileMenuOpen] = useState(false);

  // Close mobile dropdown on outside click
  useEffect(() => {
    if (!mobileProfileMenuOpen) return;
    function handleClick(e: MouseEvent) {
      const menu = document.getElementById('mobile-profile-dropdown');
      if (menu && !menu.contains(e.target as Node)) {
        setMobileProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileProfileMenuOpen]);

  return (
    <>
      <Header
        onCreateRoomClick={() => setShowCreateModal(true)}
        onProfileClick={() => setShowProfileModal(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <main className="vocably-landing-main" style={{ paddingTop: '7.5rem' }}>
        {/* Remove duplicate 'Active Rooms' and filter row here, keep only the one inside the rooms.length > 0 conditional below */}
        {roomsLoading ? (
          <div className="loading-indicator">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div
            style={{
              minHeight: '60vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: `'Inter', 'Segoe UI', Arial, sans-serif`,
              color: theme === 'dark' ? '#fff' : '#232e4d',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: '2.1rem',
              letterSpacing: '0.01em',
              opacity: 0.92,
            }}
          >
            <span style={{ fontSize: '2.7rem', fontWeight: 800, marginBottom: 12, color: theme === 'dark' ? '#ffe066' : '#10b981', fontFamily: 'inherit', display: 'block' }}>
              Welcome to Vocably
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 500, color: theme === 'dark' ? '#bdbdbd' : '#444', marginBottom: 18, display: 'block' }}>
              There are no active rooms right now.<br />Be the first to create a new conversation!
            </span>
            <button
              className={isMobile ? 'btn btn--primary create-room-mobile-btn' : 'btn btn--primary'}
              style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: 700,
                padding: isMobile ? '0.7rem 1.2rem' : '0.8rem 2.2rem',
                borderRadius: 16,
                background: theme === 'dark'
                  ? 'linear-gradient(90deg, #ffe066 60%, #bfa500 100%)'
                  : 'linear-gradient(90deg, #10b981 60%, #1de9b6 100%)',
                color: theme === 'dark' ? '#181a1b' : '#fff',
                border: 'none',
                boxShadow: theme === 'dark'
                  ? '0 2px 12px #ffe06644'
                  : '0 2px 12px #10b98144',
                marginTop: 18,
                cursor: 'pointer',
                transition: 'background 0.18s, color 0.18s',
                minWidth: isMobile ? 120 : 180,
                maxWidth: isMobile ? '340px' : undefined,
                width: isMobile ? '100%' : undefined,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: isMobile ? 'auto' : undefined,
                marginRight: isMobile ? 'auto' : undefined,
              }}
              onClick={() => setShowCreateModal(true)}
            >
              + Create Room
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'row' : 'unset', // force row on mobile
                alignItems: 'center',
                gap: isMobile ? '0.4rem' : '0.7rem',
                marginTop: isMobile ? '6.5rem' : '6.5rem', // much larger top margin for both
                marginBottom: '0.3rem',
                flexWrap: isMobile ? 'wrap' : 'nowrap',
                justifyContent: isMobile ? 'center' : 'flex-start',
                position: 'relative',
                minHeight: 48,
                width: '100%',
              }}
            >
              <h2
                className="vocably-section-title"
                style={{
                  margin: 0,
                  marginRight: isMobile ? 'auto' : 18,
                  marginLeft: isMobile ? 18 : '8rem', // increase left margin on desktop
                  alignSelf: 'flex-start',
                  fontSize: isMobile ? '1.2rem' : '1.25rem',
                  fontWeight: 800,
                  letterSpacing: '0.01em',
                  color: theme === 'dark' ? '#ffe066' : '#10b981',
                  lineHeight: 1.18,
                  flexShrink: 0,
                  paddingLeft: isMobile ? 18 : 0, // only keep padding on mobile
                  marginBottom: isMobile ? '0.5rem' : 0, // add marginBottom for spacing
                }}
              >
                Active Rooms
              </h2>
              {/* MOBILE: sign-in/user avatar at top right */}
              {isMobile && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {session ? (
                    <button
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: theme === 'dark' ? '#ffe066' : '#10b981', fontWeight: 700, fontSize: 16, cursor: 'pointer', borderRadius: 12, padding: '0.2rem 0.7rem',
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        setMobileProfileMenuOpen((v) => !v);
                      }}
                      onMouseDown={e => e.stopPropagation()}
                      aria-haspopup="true"
                      aria-expanded={mobileProfileMenuOpen}
                      tabIndex={0}
                    >
                      <Avatar style={{ width: 32, height: 32 }}>
                        {session.user?.image && <AvatarImage src={session.user.image} alt={session.user.name || 'User'} />}
                        <AvatarFallback>{session.user?.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      {session?.user?.name || 'Profile'}
                      <ChevronDown size={18} />
                    </button>
                  ) : (
                    <button
                      className="header-btn"
                      onClick={() => signIn('google')}
                    >
                      Sign in
                    </button>
                  )}
                  {/* Mobile profile dropdown */}
                  {mobileProfileMenuOpen && (
                    <div id="mobile-profile-dropdown" style={{ position: 'absolute', top: 44, right: 0, background: theme === 'dark' ? '#232e4d' : '#fff', color: theme === 'dark' ? '#ffe066' : '#232e4d', borderRadius: 12, boxShadow: '0 2px 12px #0004', zIndex: 20, minWidth: 160, padding: '0.7rem 0.5rem' }}>
                    <button
                        style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 600, fontSize: 15, padding: '0.5rem 1.2rem', width: '100%', textAlign: 'left', borderRadius: 8, cursor: 'pointer' }}
                        onClick={() => { signOut(); setMobileProfileMenuOpen(false); }}
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* DESKTOP: filter/sort/BuyMeCoffee grouped to right of title, now styled like mobile, with reduced gap */}
              {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', marginRight: '7rem' }}>
                  <button
                    className="btn btn--sm btn--secondary"
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: theme === 'dark' ? '#000' : 'linear-gradient(120deg, rgba(16,185,129,0.18) 60%, rgba(17,18,22,0.89) 100%)',
                      color: theme === 'dark' ? '#10b981' : '#10b981',
                      border: '1.5px solid #10b981',
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 15,
                      boxShadow: '0 2px 12px 0 rgba(16,185,129,0.13)',
                      padding: '0.5rem 1.1rem',
                      cursor: 'pointer',
                      transition: 'background 0.18s, color 0.18s',
                      outline: 'none',
                      minWidth: 90,
                      flex: 1,
                    }}
                  >
                    <FaFilter style={{ marginRight: 8 }} /> FILTERS
                  </button>
                  <div style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: 220 }}>
                    <select
                      className="input"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      style={{
                        background: theme === 'dark' ? '#000' : 'linear-gradient(120deg, rgba(24,26,27,0.92) 70%, rgba(17,18,22,0.89) 100%)',
                        color: theme === 'dark' ? '#ffd700' : '#ffd700',
                        border: '1.5px solid #ffd700',
                        borderRadius: 12,
                        fontWeight: 600,
                        fontSize: 15,
                        boxShadow: '0 2px 12px 0 rgba(255,215,0,0.10)',
                        padding: '0.5rem 2.2rem 0.5rem 1.1rem',
                        cursor: 'pointer',
                        outline: 'none',
                        width: '100%',
                        minWidth: 160,
                        maxWidth: 220,
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                      }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="popular">Most Popular</option>
                      <option value="alphabetical">Alphabetical</option>
                    </select>
                    <span style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: theme === 'dark' ? '#ffd700' : '#ffd700',
                      display: 'flex',
                      alignItems: 'center',
                      zIndex: 2,
                    }}>
                      <ChevronDown size={18} />
                    </span>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <BuyMeCoffee />
                  </div>
                </div>
              )}
            </div>
            {/* MOBILE: filter/sort row below title+user, BuyMeCoffee on its own line */}
            {isMobile && (
              <>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    width: '100%',
                    flexWrap: 'nowrap',
                    margin: '0.25rem 0 0.2rem 0',
                    paddingLeft: 2,
                    paddingRight: 2,
                    minHeight: 48,
                  }}
                >
                  {(() => {
                    const controlStyle = {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      height: 44,
                      minHeight: 44,
                      maxHeight: 44,
                      width: '100%',
                      fontWeight: 700,
                      fontSize: 15,
                      borderRadius: 12,
                      boxShadow: '0 2px 12px 0 rgba(16,185,129,0.13)',
                      transition: 'background 0.18s, color 0.18s',
                      outline: 'none',
                      minWidth: 0,
                      flex: '1 1 0',
                      marginBottom: 0,
                    };
                    return <>
                      <button
                        className="btn btn--sm btn--secondary"
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                          ...controlStyle,
                          background: theme === 'dark' ? '#000' : 'linear-gradient(120deg, rgba(16,185,129,0.18) 60%, rgba(17,18,22,0.89) 100%)',
                          color: theme === 'dark' ? '#10b981' : '#10b981',
                          border: '1.5px solid #10b981',
                          height: 48,
                          minHeight: 48,
                          maxHeight: 48,
                        }}
                      >
                        <FaFilter style={{ marginRight: 6 }} /> FILTERS
                      </button>
                      <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0, marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, minHeight: 44, maxHeight: 44 }}>
                        <select
                          className="input"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          style={{
                            ...controlStyle,
                            background: theme === 'dark' ? '#000' : 'linear-gradient(120deg, rgba(24,26,27,0.92) 70%, rgba(17,18,22,0.89) 100%)',
                            color: theme === 'dark' ? '#ffd700' : '#ffd700',
                            border: '1.5px solid #ffd700',
                            fontWeight: 600,
                            padding: '0.5rem 1.5rem 0.5rem 0.7rem',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                          }}
                        >
                          <option value="newest">Newest First</option>
                          <option value="popular">Most Popular</option>
                          <option value="alphabetical">Alphabetical</option>
                        </select>
                        <span style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                          color: theme === 'dark' ? '#ffd700' : '#ffd700',
                          display: 'flex',
                          alignItems: 'center',
                          zIndex: 2,
                        }}>
                          <ChevronDown size={16} />
                        </span>
                      </div>
                    </>;
                  })()}
                </div>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0.2rem 0 0.7rem 0' }}>
                  <BuyMeCoffee />
                </div>
              </>
            )}
            <RoomList
              rooms={roomsWithRealCounts}
              participantCounts={participantCounts}
              selectedLanguage={''}
              selectedLevel={''}
              onJoinRoom={handleJoinRoomSync}
              onParticipantUpdate={() => {}}
              searchTerm={searchTerm}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              sortBy={sortBy}
              setSortBy={setSortBy}
              roomType={roomType}
              setRoomType={setRoomType}
              availability={availability}
              setAvailability={setAvailability}
              isJoiningMap={isJoiningMap}
            />
          </>
        )}
      </main>
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateRoom={handleCreateRoom}
      />
      <JoinRoomModal
        isOpen={showJoinModal}
        onCancel={handleModalCancel}
        onJoin={handleModalJoin}
        roomName={joiningRoom?.name || ''}
        isJoining={joiningRoom ? !!isJoiningMap[joiningRoom.id] : false}
        requirePassword={!!joiningRoom && !joiningRoom.is_public && !!joiningRoom.password}
        passwordError={joinPasswordError || undefined}
        defaultUserName={session?.user?.name || ''}
      />
      {showProfileModal && (
        <div className="modal-backdrop flex items-center justify-center z-50 bg-black bg-opacity-40 fixed inset-0">
          <div className="modal-content max-w-lg w-full bg-[#16181c] rounded-2xl shadow-2xl border border-gray-800 p-8 relative animate-fade-in mx-4 my-8">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-primary text-2xl focus:outline-none"
              onClick={() => setShowProfileModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <UserProfile onLanguagePreferenceChange={() => {}} onClose={() => {}} />
          </div>
        </div>
      )}
      {showSignInError && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.45)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#181a1b',
            color: '#fff',
            borderRadius: 18,
            boxShadow: '0 8px 32px #0008',
            padding: '2.5rem 2.2rem',
            maxWidth: 380,
            width: '90vw',
            textAlign: 'center',
            fontSize: 18,
            fontWeight: 500,
            position: 'relative',
          }}>
            <div style={{ fontSize: 38, marginBottom: 16 }}>🚫</div>
            <div style={{ marginBottom: 18 }}>{signInErrorMessage}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
              <button
                onClick={() => {
                  // @ts-ignore
                  if (typeof window !== 'undefined') {
                    import('next-auth/react').then(({ signIn }) => signIn('google'));
                  }
                }}
                style={{
                  background: 'linear-gradient(90deg, #4285F4 0%, #1a73e8 100%)', // solid blue gradient
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 17,
                  padding: '0.7rem 2.2rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 12px 0 rgba(66,133,244,0.17)'
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => setShowSignInError(false)}
                style={{
                  background: 'linear-gradient(90deg, #10b981 80%, #1de9b6 100%)',
                  color: '#181a1b',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 17,
                  padding: '0.7rem 2.2rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 12px 0 rgba(16,185,129,0.17)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <ScrollToTopBottomButton />
    </>
  );
}
