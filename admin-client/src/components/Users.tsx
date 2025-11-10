import { useState, useEffect } from 'react';
import './Users.css';

interface User {
  _id: string;
  username: string;
  nickName?: string;
  email: string;
  profilePicture?: string;
  status: string;
  role?: string;
  createdAt: string;
  suspended?: boolean;
}

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nickName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h2>User Management</h2>
        <div className="users-stats">
          <span className="stat-badge">Total: {users.length}</span>
          <span className="stat-badge online">Online: {users.filter(u => u.status === 'online').length}</span>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search users by username, nickname, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Status</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.username} />
                      ) : (
                        user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{user.nickName || user.username}</div>
                      <div className="user-username">@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`status-badge ${user.status}`}>
                    {user.status === 'online' ? '🟢' : '⚫'} {user.status}
                  </span>
                </td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role || 'user'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-view" title="View Details">
                      👁️
                    </button>
                    <button className="btn-suspend" title="Suspend User">
                      🚫
                    </button>
                    <button className="btn-delete" title="Delete User">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="no-results">
          <p>No users found matching your search.</p>
        </div>
      )}
    </div>
  );
}

export default Users;
