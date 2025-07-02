import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaLanguage, FaGlobe, FaPlus, FaTimes, FaGem, FaEdit, FaCrown, FaPlusCircle, FaBook, FaCamera } from 'react-icons/fa';
import { X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import styles from '../styles/UserProfile.module.css';

interface LanguagePreference {
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface UserProfileProps {
  onLanguagePreferenceChange: (preferences: LanguagePreference[]) => void;
  onClose: () => void;
}

const languages = [
  'English', 'Spanish', 'French', 'German', 'Japanese',
  'Chinese', 'Korean', 'Russian', 'Portuguese', 'Italian',
  'Arabic', 'Hindi', 'Turkish', 'Dutch', 'Swedish'
];

const levels = ['Beginner', 'Intermediate', 'Advanced'];

export const UserProfile: React.FC<UserProfileProps> = ({ onLanguagePreferenceChange, onClose }) => {
  const { data: session } = useSession();
  // Prefer session user name, fallback to localStorage, then empty string
  const [username, setUsername] = useState(() => {
    if (session?.user?.name) return session.user.name;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userName') || '';
    }
    return '';
  });
  const [bio, setBio] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [learningLanguages, setLearningLanguages] = useState<LanguagePreference[]>([]);
  const [newLanguage, setNewLanguage] = useState(languages[0]);
  const [newLevel, setNewLevel] = useState(levels[0]);
  const [joinDate, setJoinDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile from API on mount
  useEffect(() => {
    if (!username) return;
    fetch(`/api/user-profile?username=${encodeURIComponent(username)}`)
      .then(res => res.ok ? res.json() : null)
      .then(profile => {
        if (profile) {
          setBio(profile.bio || '');
          setNativeLanguage(profile.native_language || 'English');
          setLearningLanguages(profile.learning_languages || []);
          setAvatar(profile.avatar_url || '');
          setJoinDate(profile.created_at || '');
        }
      });
  }, [username]);

  useEffect(() => {
    onLanguagePreferenceChange(learningLanguages);
  }, [learningLanguages, onLanguagePreferenceChange]);

  const handleAddLanguage = () => {
    if (learningLanguages.some(lang => lang.language === newLanguage)) {
      return;
    }
    setLearningLanguages([
      ...learningLanguages,
      {
        language: newLanguage,
        level: newLevel.toLowerCase() as 'beginner' | 'intermediate' | 'advanced'
      }
    ]);
  };

  const handleRemoveLanguage = (index: number) => {
    setLearningLanguages(learningLanguages.filter((lang, i) => i !== index));
  };

  // Avatar upload logic (upload to Supabase Storage in real app, here just set base64 for now)
  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In real app, upload to Supabase Storage and get public URL
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setAvatar(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
  };

  const handleSave = async () => {
    setSaving(true);
    let avatar_url = avatar;
    if (avatar && avatar.startsWith('data:')) {
      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, avatar }),
      });
      const data = await res.json();
      avatar_url = data.url || '';
    }
    // Save profile to API
    await fetch('/api/user-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        bio,
        avatar_url,
        native_language: nativeLanguage,
        learning_languages: learningLanguages,
      }),
    });
    // Notify Google Sheet with all user info if available
    if (session?.user?.email && session?.user?.name) {
      fetch('/api/notify-google-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          name: session.user.name,
          provider: 'google',
          userId: session.user.id || '',
          isNewUser: false, // set to true if you want to track new users only
          timestamp: new Date().toISOString()
        }),
      });
    }
    setSaving(false);
  };

  // If session.user.name changes (e.g., after login), update username state
  useEffect(() => {
    if (session?.user?.name && session.user.name !== username) {
      setUsername(session.user.name);
    }
  }, [session?.user?.name]);

  return (
    <div className={styles.modal} style={{ maxWidth: 480, margin: '0 auto', padding: '2.2rem 1.2rem' }}>
      {/* Header */}
      <div className={styles.modalHeader} style={{ marginBottom: '2.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className={styles.title} style={{ fontSize: '1.7rem' }}>Profile</span>
        </div>
        <button className={styles.closeButton} onClick={onClose} title="Close">
          <X size={24} className={styles.closeIcon} />
        </button>
      </div>
      {/* Avatar + Name + Bio */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <div className={styles.avatarGlow} style={{ position: 'relative', marginBottom: 8 }}>
          {avatar ? (
            <img
              src={avatar}
              alt="Profile"
              className={styles.avatarCircle}
              style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: '50%', border: '2.5px solid #ffd700' }}
            />
          ) : (
            <div className={styles.avatarCircle} style={{ width: 90, height: 90, fontSize: 36 }}>{username ? username.slice(0,2).toUpperCase() : <FaUser />}</div>
          )}
          <button
            style={{ position: 'absolute', bottom: 6, right: 6, background: '#ffd700', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px #ffd70055', cursor: 'pointer' }}
            title={avatar ? 'Change Image' : 'Add Image'}
            onClick={handleAvatarClick}
            type="button"
          >
            <FaCamera style={{ color: '#181a1b', fontSize: 18 }} />
          </button>
          {avatar && (
            <button
              style={{ position: 'absolute', top: 6, right: 6, background: '#ff4d4f', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 8px #ff4d4f55' }}
              title="Remove Image"
              onClick={handleRemoveAvatar}
              type="button"
            >
              <FaTimes />
            </button>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>
        <div style={{ width: '100%', textAlign: 'center', marginBottom: 8 }}>
          <input
            className={styles.inputField}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your display name"
            style={{ textAlign: 'center', fontWeight: 700, fontSize: 20, background: 'rgba(0,0,0,0.32)', border: '1.5px solid #ffd700', borderRadius: 10, marginBottom: 6 }}
            disabled
          />
        </div>
        <textarea
          className={styles.inputField}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Add a short bio or tagline..."
          rows={2}
          style={{ width: '100%', resize: 'none', background: 'rgba(0,0,0,0.22)', border: '1.5px solid #ffd70044', borderRadius: 10, fontSize: 15, marginBottom: 6, textAlign: 'center' }}
        />
        <button
          className={styles.addButton}
          onClick={handleSave}
          style={{ marginTop: 6, marginBottom: 2, minWidth: 120, fontSize: 15 }}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <div style={{ color: '#ffd70099', fontSize: 13, marginTop: 4 }}>
          Joined: {joinDate ? new Date(joinDate).toLocaleDateString() : '—'}
        </div>
      </div>
      {/* Personal Identity */}
      <div className={styles.section} style={{ margin: '2.2rem 0 1.2rem 0', padding: '1.5rem 1.2rem' }}>
        <div className={styles.sectionHeader} style={{ marginBottom: 10 }}>
          <FaUser className={styles.icon} />
          <h3 className={styles.sectionTitle}>Personal Identity</h3>
        </div>
        <div style={{ color: '#bdbdbd', fontSize: 15, marginTop: 2 }}>
          <b>Name:</b> {username || '—'}
        </div>
        <div style={{ color: '#bdbdbd', fontSize: 15, marginTop: 2 }}>
          <b>Bio:</b> {bio || '—'}
        </div>
      </div>
      {/* Language Mastery */}
      <div className={styles.section} style={{ margin: '1.2rem 0', padding: '1.5rem 1.2rem' }}>
        <div className={styles.sectionHeader} style={{ marginBottom: 10 }}>
          <FaLanguage className={styles.icon} />
          <h3 className={styles.sectionTitle}>Language Mastery</h3>
          <span className={styles.sectionBadge}>PRO</span>
        </div>
        <div className={styles.languageCard} style={{ margin: '1.2rem 0', padding: '1.2rem' }}>
          <div className={styles.cardHeader}>
            <FaCrown className={styles.premiumIconSmall} />
            <span className={styles.cardTitle}>Native Tongue</span>
          </div>
          <select 
            className={styles.select}
            value={nativeLanguage}
            onChange={(e) => setNativeLanguage(e.target.value)}
            style={{ marginTop: 8 }}
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
        <div className={styles.languageCard} style={{ margin: '1.2rem 0', padding: '1.2rem' }}>
          <div className={styles.cardHeader}>
            <FaPlusCircle className={styles.premiumIconSmall} />
            <span className={styles.cardTitle}>Learning Journeys</span>
          </div>
          <div className={styles.addLanguage} style={{ marginBottom: 10 }}>
            <select
              className={styles.select}
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <select
              className={styles.select}
              value={newLevel}
              onChange={(e) => setNewLevel(e.target.value)}
            >
              {levels.map(level => (
                <option key={level} value={level.toLowerCase()}>{level}</option>
              ))}
            </select>
            <button 
              className={styles.addButton}
              onClick={handleAddLanguage}
              style={{ minWidth: 110 }}
            >
              Add Language
            </button>
          </div>
          <div className={styles.languageList}>
            {learningLanguages.length === 0 && (
              <div style={{ color: '#ffd70099', fontSize: 15, textAlign: 'center', margin: '1.2rem 0' }}>
                No learning languages added yet.
              </div>
            )}
            {learningLanguages.map((lang, index) => (
              <div key={index} className={styles.languageItem}>
                <FaBook className={styles.languageIcon} />
                <span className={styles.languageName}>{lang.language}</span>
                <span className={styles.languageLevel}>{lang.level}</span>
                <button 
                  className={styles.removeButton}
                  onClick={() => handleRemoveLanguage(index)}
                >
                  <FaTimes size={14} className={styles.removeIcon} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Achievements/Badges */}
      <div className={styles.section} style={{ margin: '1.2rem 0', padding: '1.2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <FaGem style={{ color: '#ffd700', fontSize: 22, filter: 'drop-shadow(0 0 8px #ffd70088)' }} />
          <span style={{ color: '#ffd700', fontWeight: 700, fontSize: 16 }}>Premium Member</span>
        </div>
        <div style={{ color: '#bdbdbd', fontSize: 14 }}>More badges and achievements coming soon!</div>
      </div>
    </div>
  );
};