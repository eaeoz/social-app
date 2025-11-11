import { useState, useEffect } from 'react';
import './Rooms.css';

interface Room {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  isPrivate: boolean;
  createdAt: string;
  userCount?: number;
}

function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '💬',
    isPrivate: false
  });
  const [error, setError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');

  // Comprehensive emoji list with keywords
  const emojiCategories = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴'],
    'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈'],
    'Food': ['🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🥝', '🍅', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🥒', '🥬', '🥦', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙'],
    'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵'],
    'Travel': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🚁', '🛰️', '🚀'],
    'Objects': ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷'],
    'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴']
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/rooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Rooms data received:', data.rooms);
        // Log icons specifically
        data.rooms.forEach((room: Room) => {
          console.log(`Room "${room.name}" icon:`, room.icon, typeof room.icon);
        });
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        description: room.description || '',
        icon: room.icon || '💬',
        isPrivate: room.isPrivate
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: '',
        description: '',
        icon: '💬',
        isPrivate: false
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRoom(null);
    setFormData({
      name: '',
      description: '',
      icon: '💬',
      isPrivate: false
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Room name is required');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingRoom
        ? `${import.meta.env.VITE_API_URL}/admin/rooms/${editingRoom._id}`
        : `${import.meta.env.VITE_API_URL}/admin/rooms`;

      const response = await fetch(url, {
        method: editingRoom ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchRooms();
        handleCloseModal();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save room');
      }
    } catch (error) {
      console.error('Error saving room:', error);
      setError('An error occurred while saving the room');
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchRooms();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete room');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('An error occurred while deleting the room');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading rooms...</p>
      </div>
    );
  }

  return (
    <div className="rooms-container">
      <div className="rooms-header">
        <div>
          <h2>Rooms Management</h2>
          <p className="subtitle">Manage chat rooms and their settings</p>
        </div>
        <button className="btn-add" onClick={() => handleOpenModal()}>
          ➕ Add New Room
        </button>
      </div>

      <div className="rooms-grid">
        {rooms.map((room) => (
          <div key={room._id} className="room-card">
            <div className="room-header">
              <h3>
                {room.icon && <span className="room-icon">{room.icon}</span>}
                {!room.icon && <span className="room-icon">💬</span>}
                <span style={{ marginLeft: room.icon ? '0.5rem' : '0.5rem' }}>{room.name}</span>
              </h3>
              <span className={`room-type ${room.isPrivate ? 'private' : 'public'}`}>
                {room.isPrivate ? '🔒 Private' : '🌐 Public'}
              </span>
            </div>
            
            {room.description && (
              <p className="room-description">{room.description}</p>
            )}
            
            <div className="room-meta">
              <span className="room-date">
                📅 Created: {new Date(room.createdAt).toLocaleDateString()}
              </span>
              {room.userCount !== undefined && (
                <span className="room-users">
                  👥 {room.userCount} users
                </span>
              )}
            </div>

            <div className="room-actions">
              <button
                className="btn-edit"
                onClick={() => handleOpenModal(room)}
                title="Edit Room"
              >
                ✏️ Edit
              </button>
              <button
                className="btn-delete"
                onClick={() => handleDelete(room._id)}
                title="Delete Room"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="no-results">
          <p>No rooms found. Click "Add New Room" to create one.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRoom ? 'Edit Room' : 'Add New Room'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="icon">Room Icon *</label>
                <div className="icon-selector-compact">
                  <div className="icon-display">
                    <span className="current-icon">{formData.icon}</span>
                    <button
                      type="button"
                      className="emoji-picker-btn"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      {showEmojiPicker ? 'Close' : 'Change Icon'}
                    </button>
                  </div>

                  {showEmojiPicker && (
                    <div className="emoji-picker-popup">
                      <div className="emoji-picker-header">
                        <span>Select an Icon</span>
                        <button
                          type="button"
                          className="emoji-picker-close"
                          onClick={() => {
                            setShowEmojiPicker(false);
                            setEmojiSearch('');
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <div className="emoji-search-box">
                        <input
                          type="text"
                          placeholder="🔍 Search emojis..."
                          value={emojiSearch}
                          onChange={(e) => setEmojiSearch(e.target.value)}
                          className="emoji-search-input"
                        />
                      </div>
                      <div className="emoji-picker-content">
                        {Object.entries(emojiCategories)
                          .map(([category, emojis]) => {
                            // Filter emojis based on search
                            const filteredEmojis = emojiSearch
                              ? emojis.filter(() => 
                                  category.toLowerCase().includes(emojiSearch.toLowerCase())
                                )
                              : emojis;

                            // Don't show category if no emojis match
                            if (filteredEmojis.length === 0) return null;

                            return (
                              <div key={category} className="emoji-category">
                                <div className="emoji-category-title">{category}</div>
                                <div className="emoji-grid">
                                  {filteredEmojis.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      className={`emoji-option ${formData.icon === emoji ? 'selected' : ''}`}
                                      onClick={() => {
                                        setFormData({ ...formData, icon: emoji });
                                        setShowEmojiPicker(false);
                                        setEmojiSearch('');
                                      }}
                                      title={emoji}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })
                          .filter(Boolean)}
                        {emojiSearch && 
                          Object.entries(emojiCategories).every(([category]) => 
                            !category.toLowerCase().includes(emojiSearch.toLowerCase())
                          ) && (
                          <div className="no-emoji-results">
                            <p>No emojis found for "{emojiSearch}"</p>
                            <p>Try searching by category: smileys, animals, food, activities, travel, objects, symbols</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="name">Room Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter room name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter room description (optional)"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isPrivate}
                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  />
                  <span>Private Room</span>
                </label>
                <small className="form-hint">
                  Private rooms require invitation to join
                </small>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingRoom ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Rooms;
