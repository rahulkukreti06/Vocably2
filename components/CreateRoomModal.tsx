import React, { useState } from 'react';
import { FaTimes, FaGlobe, FaLock, FaTag, FaUsers, FaFont, FaLanguage, FaComments } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import '../styles/vocably-modal.css';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: {
    name: string;
    language: string;
    language_level: 'beginner' | 'intermediate' | 'advanced';
    isPublic: boolean;
    password?: string;
    maxParticipants: number;
    topic?: string;
    tags: string[];
  }) => void;
}

const languages = [
'English', 'Spanish', 'French', 'German', 'Japanese',
'Chinese', 'Korean', 'Russian', 'Portuguese', 'Italian',
'Arabic', 'Hindi', 'Turkish', 'Dutch', 'Swedish',
'Bengali', 'Urdu', 'Vietnamese', 'Polish', 'Persian',
'Thai', 'Ukrainian', 'Hebrew', 'Indonesian', 'Malay',
'Romanian', 'Greek', 'Czech', 'Hungarian', 'Finnish',
'Tamil', 'Telugu', 'Marathi', 'Punjabi', 'Malayalam'

];

const levels = ['Beginner', 'Intermediate', 'Advanced'];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
}) => {
  const [name, setName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [selectedLevel, setSelectedLevel] = useState(levels[0]);
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [topic, setTopic] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    onCreateRoom({
      name,
      language: selectedLanguage,
      language_level: selectedLevel.toLowerCase() as 'beginner' | 'intermediate' | 'advanced',
      isPublic,
      password: isPublic ? undefined : password,
      maxParticipants,
      topic,
      tags,
    });
    // Reset all fields after creating a room
    setName('');
    setSelectedLanguage(languages[0]);
    setSelectedLevel(levels[0]);
    setIsPublic(true);
    setPassword('');
    setMaxParticipants(10);
    setTopic('');
    setTags([]);
    setNewTag('');
    // Do not call onClose here; let the parent handle closing the modal
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="modal-overlay vocably-modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(2px)' }}>
      <div className="modal-content" style={{ background: '#14161a', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.35)' }}>
        <button className="modal-close-btn" onClick={onClose} title="Close">
          <FaTimes />
        </button>
        <h2 style={{marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.35rem', color: 'var(--primary)'}}>Create New Room</h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Room Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Language</label>
            <Select
              classNamePrefix="vocably-select"
              options={languages.map(lang => ({ value: lang, label: lang }))}
              value={{ value: selectedLanguage, label: selectedLanguage }}
              onChange={option => setSelectedLanguage(option?.value || languages[0])}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: '#181a20',
                  borderColor: '#333',
                  color: '#fff',
                  minHeight: 44,
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                  fontSize: 16
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: '#181a20',
                  color: '#fff',
                  borderRadius: 8
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? '#23272f' : '#181a20',
                  color: '#fff',
                  cursor: 'pointer',
                }),
                singleValue: (base) => ({
                  ...base,
                  color: '#fff',
                }),
                input: (base) => ({
                  ...base,
                  color: '#fff',
                }),
                dropdownIndicator: (base) => ({
                  ...base,
                  color: '#ccc',
                }),
                indicatorSeparator: (base) => ({
                  ...base,
                  backgroundColor: '#333',
                })
              }}
              isSearchable
              placeholder="Select language..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Level</label>
            <Select
              classNamePrefix="vocably-select"
              options={levels.map(level => ({ value: level, label: level }))}
              value={{ value: selectedLevel, label: selectedLevel }}
              onChange={option => setSelectedLevel(option?.value || levels[0])}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: '#181a20',
                  borderColor: '#333',
                  color: '#fff',
                  minHeight: 44,
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                  fontSize: 16
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: '#181a20',
                  color: '#fff',
                  borderRadius: 8
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? '#23272f' : '#181a20',
                  color: '#fff',
                  cursor: 'pointer',
                }),
                singleValue: (base) => ({
                  ...base,
                  color: '#fff',
                }),
                input: (base) => ({
                  ...base,
                  color: '#fff',
                }),
                dropdownIndicator: (base) => ({
                  ...base,
                  color: '#ccc',
                }),
                indicatorSeparator: (base) => ({
                  ...base,
                  backgroundColor: '#333',
                })
              }}
              isSearchable={false}
              placeholder="Select level..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Room Type</label>
            <div className="mt-2 space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2">Public <FaGlobe className="inline" /></span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2">Private <FaLock className="inline" /></span>
              </label>
            </div>
          </div>

          {!isPublic && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Max Participants</label>
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
              min="2"
              max="50"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Topic (Optional)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tags</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="tag"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
              >
                <FaTag />
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full mt-6 py-2 px-4 rounded-lg text-white font-semibold vocably-create-btn"
              style={{
                background: 'linear-gradient(90deg, #6366f1 0%, #7f53ac 100%)',
                boxShadow: '0 2px 12px rgba(99,102,241,0.15)',
                letterSpacing: '0.5px',
                fontSize: 17,
                border: 'none',
                outline: 'none',
                transition: 'background 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
              }}
            >
              Create Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};