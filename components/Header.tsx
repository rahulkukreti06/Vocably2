"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Plus, Sun, Moon, ChevronDown } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import "../styles/header.css";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

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

export function SearchBar({ searchTerm, onSearchChange }: { searchTerm?: string, onSearchChange?: (term: string) => void }) {
  return (
    <div className="search-input">
      <input
        type="text"
        placeholder="Search by room, language, level, or username..."
        value={searchTerm || ''}
        onChange={e => onSearchChange && onSearchChange(e.target.value)}
        aria-label="Search rooms"
      />
    </div>
  );
}

interface HeaderProps {
  onCreateRoomClick?: () => void;
  onProfileClick?: () => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onCreateRoomClick, onProfileClick, searchTerm, onSearchChange }) => {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showLightThemeMsg, setShowLightThemeMsg] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 641px)');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const { data: session, status } = useSession();
  useEffect(() => {
    if (session) {
      // Debug: log the session object to check user.image
      // eslint-disable-next-line no-console
      console.log('SESSION DEBUG:', session);
    }
  }, [session]);

  useEffect(() => {
    setMounted(true);
    // Initialize theme from localStorage after mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
      } else {
        // Optionally: detect system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Apply the same layout and behavior for both themes
    document.documentElement.classList.add(theme);
    document.documentElement.classList.remove(theme === 'dark' ? 'light' : 'dark');
    document.body.classList.add(theme);
    document.body.classList.remove(theme === 'dark' ? 'light' : 'dark');
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const handleThemeClick = () => {
    if (theme === 'dark') {
      setShowLightThemeMsg(true);
      setTimeout(() => setShowLightThemeMsg(false), 2200);
    } else {
      setTheme('dark');
    }
  };

  // Add responsive styles for the Header component
  return (
    <div className="header-root">
      {showLightThemeMsg && (
        <div
          style={{
            position: 'fixed',
            top: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(90deg, #fffbe6 60%, #ffe066 100%)',
            color: '#232e4d',
            border: '2.5px solid #ffe066',
            borderRadius: 18,
            boxShadow: '0 8px 32px #ffe06655, 0 2px 12px #10b98133',
            padding: '1.1rem 2.7rem',
            fontWeight: 800,
            fontSize: 20,
            zIndex: 9999,
            textAlign: 'center',
            letterSpacing: '0.01em',
            textShadow: '0 2px 12px #ffe06688, 0 1px 0 #fffbe6cc',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            animation: 'fade-in-popup 0.25s cubic-bezier(.4,2,.3,1)',
          }}
        >
          <span style={{ fontSize: 26, marginRight: 14, filter: 'drop-shadow(0 2px 8px #ffe06688)' }}>✨</span>
          <span>Light theme <span style={{ color: '#bfa100', fontWeight: 900 }}>coming soon</span>!</span>
          <style>{`
            @keyframes fade-in-popup {
              from {
                opacity: 0;
                transform: scale(0.9);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
        </div>
      )}
      {/* Mobile Layout */}
      {!isDesktop ? (
        <div className="header-container">
          {/* Brand Title */}
          <div className="header-logo">
            <Link href="/" className="header-brand-text">
              <span style={{ fontWeight: 900, fontSize: '2rem', letterSpacing: '0.04em', background: 'linear-gradient(90deg, #ffe066 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Vocably</span>
            </Link>
          </div>
          {/* Search Bar */}
          <div className="search-bar-container">
            <SearchBar searchTerm={searchTerm} onSearchChange={onSearchChange} />
          </div>
          {/* Mobile Menu Button */}
          <div className="header-actions">
            <button
              className="header-menu-btn"
              aria-label="Open menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          {/* Mobile Dropdown Menu */}
          {menuOpen && (
            <div className="header-mobile-menu">
              <button className="header-btn create-room-btn" tabIndex={0} onClick={onCreateRoomClick}>
                <Plus size={18} /> Create Room
              </button>
              <button
                className="theme-btn"
                onClick={handleThemeClick}
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
              {status === "loading" ? null : !session ? (
                <button
                  className="header-btn"
                  onClick={() => {
                    signIn("google");
                    setMenuOpen(false);
                  }}
                >
                  Sign in with Google
                </button>
              ) : (
                <button
                  className="header-btn"
                  onClick={() => {
                    signOut();
                    setMenuOpen(false);
                  }}
                >
                  Sign out
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Desktop Layout */
        <div className="header-container">
          <div className="header-logo">
            <Link href="/" className="header-brand-text">
              <span style={{ fontWeight: 900, fontSize: '2.2rem', letterSpacing: '0.04em', background: 'linear-gradient(90deg, #ffe066 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Vocably</span>
            </Link>
          </div>
          <SearchBar searchTerm={searchTerm} onSearchChange={onSearchChange} />
          <nav className="header-actions">
            <button className="header-btn create-room-btn" tabIndex={0} onClick={onCreateRoomClick}>
              <Plus size={18} /> Create Room
            </button>
            {status === "loading" ? null : !session ? (
              <button
                className="header-btn"
                onClick={() => signIn("google")}
                tabIndex={0}
              >
                Sign in
              </button>
            ) : (
              <div>
                <button
                  className="header-btn"
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={profileMenuOpen}
                  tabIndex={0}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <Avatar style={{ width: 32, height: 32 }}>
                    {session.user?.image && <AvatarImage src={session.user.image} alt={session.user.name || 'User'} />}
                    <AvatarFallback>{session.user?.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  {session?.user?.name || 'Profile'}
                  <ChevronDown size={18} />
                </button>
                {profileMenuOpen && (
                  <div className="header-profile-dropdown">
                    <button
                      className="header-btn"
                      onClick={handleThemeClick}
                    >
                      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    </button>
                    <button
                      className="header-btn"
                      onClick={() => { signOut(); setProfileMenuOpen(false); }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
