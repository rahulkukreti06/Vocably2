import React, { useEffect, useState } from 'react';
import { FaUser, FaLanguage, FaCrown, FaPlusCircle, FaBook, FaTimes } from 'react-icons/fa';
import styles from '../styles/UserProfile.module.css';

interface LanguagePreference {
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface ViewUserProfileModalProps {
  username: string;
  onClose: () => void;
}

export const ViewUserProfileModal: React.FC<ViewUserProfileModalProps> = ({ username, onClose }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`/api/user-profile?username=${encodeURIComponent(username)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && !data.error) {
          setProfile(data);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
  }, [username]);

  return (
    <div className="profile-overlay">
      <div className="profile-container" style={{ maxWidth: 480, margin: '0 auto', padding: '2.2rem 1.2rem', position: 'relative' }}>
        <button className={styles.closeButton} onClick={onClose} title="Close" style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
          <FaTimes size={22} />
        </button>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#ffd700' }}>Loading...</div>
        ) : notFound ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#ff4d4f' }}>Profile not found.</div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
              <div className={styles.avatarGlow} style={{ position: 'relative', marginBottom: 8 }}>
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className={styles.avatarCircle}
                    style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: '50%', border: '2.5px solid #ffd700' }}
                  />
                ) : (
                  <div className={styles.avatarCircle} style={{ width: 90, height: 90, fontSize: 36 }}>{profile.username ? profile.username.slice(0,2).toUpperCase() : <FaUser />}</div>
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: 22, color: '#ffd700', marginBottom: 4 }}>{profile.username}</div>
              <div style={{ color: '#bdbdbd', fontSize: 15, marginBottom: 6 }}>{profile.bio || <span style={{ color: '#888' }}>No bio</span>}</div>
              <div style={{ color: '#ffd70099', fontSize: 13, marginTop: 4 }}>
                Joined: {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
              </div>
            </div>
            <div className={styles.section} style={{ margin: '1.2rem 0', padding: '1.5rem 1.2rem' }}>
              <div className={styles.sectionHeader} style={{ marginBottom: 10 }}>
                <FaLanguage className={styles.icon} />
                <h3 className={styles.sectionTitle}>Language Mastery</h3>
              </div>
              <div className={styles.languageCard} style={{ margin: '1.2rem 0', padding: '1.2rem' }}>
                <div className={styles.cardHeader}>
                  <FaCrown className={styles.premiumIconSmall} />
                  <span className={styles.cardTitle}>Native Tongue</span>
                </div>
                <div style={{ color: '#ffd700', fontWeight: 600, fontSize: 16, marginTop: 8 }}>{profile.native_language || '—'}</div>
              </div>
              <div className={styles.languageCard} style={{ margin: '1.2rem 0', padding: '1.2rem' }}>
                <div className={styles.cardHeader}>
                  <FaPlusCircle className={styles.premiumIconSmall} />
                  <span className={styles.cardTitle}>Learning Journeys</span>
                </div>
                <div className={styles.languageList}>
                  {(!profile.learning_languages || profile.learning_languages.length === 0) && (
                    <div style={{ color: '#ffd70099', fontSize: 15, textAlign: 'center', margin: '1.2rem 0' }}>
                      No learning languages added yet.
                    </div>
                  )}
                  {profile.learning_languages && profile.learning_languages.map((lang: LanguagePreference, index: number) => (
                    <div key={index} className={styles.languageItem}>
                      <FaBook className={styles.languageIcon} />
                      <span className={styles.languageName}>{lang.language}</span>
                      <span className={styles.languageLevel}>{lang.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 