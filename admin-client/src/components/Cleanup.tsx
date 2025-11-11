import { useState, useEffect } from 'react';
import './Cleanup.css';

interface User {
  _id: string;
  email: string;
  username: string;
  nickName?: string;
  age?: number;
  gender?: string;
  suspended?: boolean;
  emailVerified?: boolean;
  reportCount?: number;
}

function Cleanup() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (searchTerm.length >= 3) {
      fetchUsers();
    } else {
      setFilteredUsers([]);
    }
  }, [searchTerm]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched users data:', data);
        const usersList = data.users || [];
        setUsers(usersList);
        filterUsers(usersList);
      } else {
        console.error('Failed to fetch users:', response.status);
        setMessage('❌ Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('❌ Error fetching users');
    }
  };

  const filterUsers = (userList: User[]) => {
    const term = searchTerm.toLowerCase();
    const filtered = userList.filter(
      (user) =>
        user.email?.toLowerCase().includes(term) ||
        user.username?.toLowerCase().includes(term) ||
        user.nickName?.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
  };

  const handleCleanupPublicMessages = async () => {
    if (!selectedUser) return;

    if (!confirm(`Are you sure you want to delete all public messages for ${selectedUser.username}?`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/cleanup/public-messages/${selectedUser._id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Successfully deleted ${data.deletedCount || 0} public messages`);
      } else {
        setMessage('❌ Failed to delete public messages');
      }
    } catch (error) {
      console.error('Error deleting public messages:', error);
      setMessage('❌ Error deleting public messages');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleCleanupPrivateMessages = async () => {
    if (!selectedUser) return;

    if (!confirm(`Are you sure you want to delete all private messages for ${selectedUser.username}?`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/cleanup/private-messages/${selectedUser._id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Successfully deleted ${data.deletedCount || 0} private messages`);
      } else {
        setMessage('❌ Failed to delete private messages');
      }
    } catch (error) {
      console.error('Error deleting private messages:', error);
      setMessage('❌ Error deleting private messages');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleCleanupAllMessages = async () => {
    if (!confirm('⚠️ Are you sure you want to delete ALL messages from ALL users? This action cannot be undone!')) {
      return;
    }

    if (!confirm('⚠️ FINAL WARNING: This will permanently delete ALL messages in the system. Type YES to confirm.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/cleanup/all-messages`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Successfully deleted ${data.deletedCount || 0} total messages`);
      } else {
        setMessage('❌ Failed to delete all messages');
      }
    } catch (error) {
      console.error('Error deleting all messages:', error);
      setMessage('❌ Error deleting all messages');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleCleanupByDate = async () => {
    if (!selectedDate) {
      setMessage('❌ Please select a date');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const dateObj = new Date(selectedDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    if (!confirm(`⚠️ Are you sure you want to delete ALL messages created before ${formattedDate}? This action cannot be undone!`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/cleanup/messages-by-date`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ date: selectedDate }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Successfully deleted ${data.deletedCount || 0} messages before ${formattedDate}`);
        setSelectedDate('');
      } else {
        setMessage('❌ Failed to delete messages by date');
      }
    } catch (error) {
      console.error('Error deleting messages by date:', error);
      setMessage('❌ Error deleting messages by date');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="cleanup-container">
      <div className="cleanup-header">
        <h2>🧹 Cleanup Messages</h2>
        <p>Search for a user and cleanup their messages, or cleanup all messages system-wide</p>
      </div>

      {message && (
        <div className={`cleanup-message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="cleanup-content">
        <div className="cleanup-section">
          <h3>🔍 Search User</h3>
          <div className="search-box">
            <input
              type="text"
              placeholder="Type at least 3 characters to search by email, username, or nickname..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm.length > 0 && searchTerm.length < 3 && (
              <div className="search-hint">Type at least 3 characters to search</div>
            )}
          </div>

          {filteredUsers.length > 0 && (
            <div className="users-list">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className={`user-card ${selectedUser?._id === user._id ? 'selected' : ''}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="user-info">
                    <div className="user-main">
                      <strong>{user.username}</strong>
                      {user.nickName && <span className="nickname">({user.nickName})</span>}
                    </div>
                    <div className="user-email">{user.email}</div>
                  </div>
                  <div className="user-details">
                    {user.age && <span className="detail-badge">Age: {user.age}</span>}
                    {user.gender && <span className="detail-badge">Gender: {user.gender}</span>}
                    <span className={`detail-badge ${user.suspended ? 'suspended' : 'active'}`}>
                      {user.suspended ? '🚫 Suspended' : '✅ Active'}
                    </span>
                    <span className={`detail-badge ${user.emailVerified ? 'verified' : 'unverified'}`}>
                      {user.emailVerified ? '✉️ Verified' : '✉️ Unverified'}
                    </span>
                    {user.reportCount !== undefined && (
                      <span className="detail-badge report-count">
                        🚨 Reports: {user.reportCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedUser && (
          <div className="cleanup-section selected-user-section">
            <h3>🎯 Selected User</h3>
            <div className="selected-user-info">
              <div className="info-row">
                <strong>Username:</strong> {selectedUser.username}
              </div>
              {selectedUser.nickName && (
                <div className="info-row">
                  <strong>Nickname:</strong> {selectedUser.nickName}
                </div>
              )}
              <div className="info-row">
                <strong>Email:</strong> {selectedUser.email}
              </div>
            </div>

            <div className="cleanup-actions">
              <button
                className="cleanup-btn public"
                onClick={handleCleanupPublicMessages}
                disabled={loading}
              >
                {loading ? '⏳ Processing...' : '🗑️ Cleanup Public Messages'}
              </button>
              <button
                className="cleanup-btn private"
                onClick={handleCleanupPrivateMessages}
                disabled={loading}
              >
                {loading ? '⏳ Processing...' : '🗑️ Cleanup Private Messages'}
              </button>
            </div>
          </div>
        )}

        <div className="cleanup-section danger-zone">
          <h3>⚠️ Danger Zone</h3>
          
          <div className="date-cleanup-section">
            <h4>📅 Delete Messages by Date</h4>
            <p className="warning-text">
              Select a date to delete all messages created before that date.
            </p>
            <div className="date-cleanup-controls">
              <input
                type="date"
                className="date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                disabled={loading}
              />
              <button
                className="cleanup-btn date-cleanup"
                onClick={handleCleanupByDate}
                disabled={loading || !selectedDate}
              >
                {loading ? '⏳ Processing...' : '🗑️ Delete Older Messages'}
              </button>
            </div>
          </div>

          <div className="separator"></div>

          <div className="all-messages-section">
            <h4>💥 Delete All Messages</h4>
            <p className="warning-text">
              This will permanently delete ALL messages from ALL users in the system.
              This cannot be undone!
            </p>
            <button
              className="cleanup-btn danger"
              onClick={handleCleanupAllMessages}
              disabled={loading}
            >
              {loading ? '⏳ Processing...' : '💥 Cleanup ALL Messages'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cleanup;
