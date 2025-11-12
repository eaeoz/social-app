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
  userSuspended?: boolean;
  bio?: string;
  age?: number;
  gender?: string;
  lastSeen?: string;
  emailVerified?: boolean;
  reportCount?: number;
}

interface PasswordRecoveryModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPasswordRecoveryModal, setShowPasswordRecoveryModal] = useState(false);
  const [recoveryUser, setRecoveryUser] = useState<User | null>(null);

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

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
  };

  const handleSuspend = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'unsuspend' : 'suspend'} this user?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}/suspend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ suspend: !currentStatus })
      });

      if (response.ok) {
        await fetchUsers();
        alert(`User ${currentStatus ? 'unsuspended' : 'suspended'} successfully`);
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to update user status');
    }
  };

  const handlePasswordRecovery = (user: User) => {
    setRecoveryUser(user);
    setShowPasswordRecoveryModal(true);
  };

  const handleDelete = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to DELETE user "${username}"? This action cannot be undone and will remove all their data.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchUsers();
        alert('User deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
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
      <h1 className="visually-hidden">User Management - Netcify Admin Dashboard</h1>
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

      {/* Desktop Table View */}
      <div className="users-table-container desktop-view">
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
              <tr key={user._id} className={user.userSuspended ? 'suspended-row' : ''}>
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
                      <div className="user-name">
                        {user.nickName || user.username}
                        {user.userSuspended && <span className="suspended-label">🚫 Suspended</span>}
                      </div>
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
                    <button 
                      className="btn-view" 
                      title="View Details"
                      onClick={() => handleViewDetails(user)}
                    >
                      👁️
                    </button>
                    <div 
                      className={`status-indicator ${user.userSuspended ? 'suspended' : 'active'}`}
                      title={user.userSuspended ? 'User is suspended' : 'User is active'}
                    >
                      {user.userSuspended ? '🚫' : '✅'}
                    </div>
                    <div 
                      className={`report-count ${
                        (user.reportCount || 0) === 0 ? '' :
                        (user.reportCount || 0) >= 8 ? 'danger-level' :
                        (user.reportCount || 0) >= 5 ? 'warning-level' :
                        'low-level'
                      }`}
                      title={`${user.reportCount || 0} pending report${(user.reportCount || 0) !== 1 ? 's' : ''}${
                        (user.reportCount || 0) >= 8 ? ' - Critical! Near suspension threshold' :
                        (user.reportCount || 0) >= 5 ? ' - Warning! Requires attention' :
                        (user.reportCount || 0) > 0 ? ' - Monitoring' : ''
                      }`}
                    >
                      {user.reportCount || 0}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="users-cards-container mobile-view">
        {filteredUsers.map((user) => (
          <div key={user._id} className={`user-card ${user.userSuspended ? 'suspended' : ''}`}>
            <div className="user-card-header">
              <div className="user-card-avatar">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.username} />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="user-card-info">
                <div className="user-card-name">
                  {user.nickName || user.username}
                  {user.userSuspended && <span className="suspended-badge">🚫</span>}
                </div>
                <div className="user-card-username">@{user.username}</div>
                <div className="user-card-email">{user.email}</div>
              </div>
              <div className="user-card-status-badges">
                <span className={`status-badge ${user.status}`}>
                  {user.status === 'online' ? '🟢' : '⚫'}
                </span>
                <div 
                  className={`report-count ${
                    (user.reportCount || 0) === 0 ? '' :
                    (user.reportCount || 0) >= 8 ? 'danger-level' :
                    (user.reportCount || 0) >= 5 ? 'warning-level' :
                    'low-level'
                  }`}
                  title={`${user.reportCount || 0} pending report${(user.reportCount || 0) !== 1 ? 's' : ''}`}
                >
                  {user.reportCount || 0}
                </div>
              </div>
            </div>
            
            <div className="user-card-details">
              <div className="user-card-detail-item">
                <span className="detail-label">Role:</span>
                <span className={`role-badge ${user.role}`}>
                  {user.role || 'user'}
                </span>
              </div>
              <div className="user-card-detail-item">
                <span className="detail-label">Joined:</span>
                <span className="detail-value">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="user-card-actions">
              <button 
                className="card-btn card-btn-view" 
                onClick={() => handleViewDetails(user)}
              >
                👁️ View Details
              </button>
              <button 
                className="card-btn card-btn-suspend"
                onClick={() => handleSuspend(user._id, user.userSuspended || false)}
              >
                {user.userSuspended ? '✅ Unsuspend' : '🚫 Suspend'}
              </button>
              <button 
                className="card-btn card-btn-delete"
                onClick={() => handleDelete(user._id, user.username)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="no-results">
          <p>No users found matching your search.</p>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content user-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="user-details-header">
                <div className="user-details-avatar">
                  {selectedUser.profilePicture ? (
                    <img src={selectedUser.profilePicture} alt={selectedUser.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="user-details-title">
                  <h3>{selectedUser.nickName || selectedUser.username}</h3>
                  <p className="username-detail">@{selectedUser.username}</p>
                  <div className="status-badges">
                    <span className={`status-badge ${selectedUser.status}`}>
                      {selectedUser.status === 'online' ? '🟢 Online' : '⚫ Offline'}
                    </span>
                    <span className={`role-badge ${selectedUser.role}`}>
                      {selectedUser.role || 'user'}
                    </span>
                    {selectedUser.userSuspended && (
                      <span className="status-badge suspended">🚫 Suspended</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="user-details-grid">
                <div className="detail-row">
                  <span className="detail-label">📧 Email:</span>
                  <span className="detail-value">{selectedUser.email}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">✅ Email Verified:</span>
                  <span className="detail-value">
                    {selectedUser.emailVerified ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">📅 Joined:</span>
                  <span className="detail-value">
                    {new Date(selectedUser.createdAt).toLocaleString()}
                  </span>
                </div>

                {selectedUser.lastSeen && selectedUser.status !== 'online' && (
                  <div className="detail-row">
                    <span className="detail-label">👁️ Last Seen:</span>
                    <span className="detail-value">
                      {new Date(selectedUser.lastSeen).toLocaleString()}
                    </span>
                  </div>
                )}

                {selectedUser.age && (
                  <div className="detail-row">
                    <span className="detail-label">🎂 Age:</span>
                    <span className="detail-value">{selectedUser.age}</span>
                  </div>
                )}

                {selectedUser.gender && (
                  <div className="detail-row">
                    <span className="detail-label">👤 Gender:</span>
                    <span className="detail-value">{selectedUser.gender}</span>
                  </div>
                )}

                {selectedUser.bio && (
                  <div className="detail-row full-width">
                    <span className="detail-label">📝 Bio:</span>
                    <span className="detail-value bio">{selectedUser.bio}</span>
                  </div>
                )}

                <div className="detail-row">
                  <span className="detail-label">🆔 User ID:</span>
                  <span className="detail-value code">{selectedUser._id}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-action recovery"
                  onClick={() => {
                    handlePasswordRecovery(selectedUser);
                    handleCloseModal();
                  }}
                >
                  🔐 Recover Password
                </button>
                <button 
                  className="btn-action suspend"
                  onClick={() => {
                    handleSuspend(selectedUser._id, selectedUser.userSuspended || false);
                    handleCloseModal();
                  }}
                >
                  {selectedUser.userSuspended ? '✅ Unsuspend User' : '🚫 Suspend User'}
                </button>
                <button 
                  className="btn-action delete"
                  onClick={() => {
                    handleDelete(selectedUser._id, selectedUser.username);
                    handleCloseModal();
                  }}
                >
                  🗑️ Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Recovery Modal */}
      {showPasswordRecoveryModal && recoveryUser && (
        <PasswordRecoveryModal
          user={recoveryUser}
          onClose={() => {
            setShowPasswordRecoveryModal(false);
            setRecoveryUser(null);
          }}
          onSuccess={() => {
            setShowPasswordRecoveryModal(false);
            setRecoveryUser(null);
          }}
        />
      )}
    </div>
  );
}

function PasswordRecoveryModal({ user, onClose, onSuccess }: PasswordRecoveryModalProps) {
  const [loading, setLoading] = useState(false);
  const [recoveryUrl, setRecoveryUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [step, setStep] = useState<'confirm' | 'result'>('confirm');

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Step 1: Generate token via backend
      const tokenResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/users/${user._id}/password-recovery`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ sendEmail: false }) // Never send email from backend
        }
      );

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        alert(`Failed to generate recovery token: ${error.error || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      const tokenData = await tokenResponse.json();
      const resetToken = tokenData.recoveryUrl.split('token=')[1]; // Extract token from URL
      setRecoveryUrl(tokenData.recoveryUrl);

      // Step 2: If sendEmail is enabled, call Netlify function to send the email
      if (sendEmail) {
        try {
          const emailResponse = await fetch(
            '/.netlify/functions/send-password-reset',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email: user.email,
                username: user.username,
                resetToken: resetToken
              })
            }
          );

          const emailData = await emailResponse.json();

          if (emailData.success) {
            setEmailSent(true);
            setEmailError('');
          } else {
            setEmailSent(false);
            setEmailError(emailData.message || emailData.note || 'Failed to send email');
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          setEmailSent(false);
          setEmailError('Failed to send email. You can copy the link manually.');
        }
      }

      setStep('result');
    } catch (error) {
      console.error('Error generating recovery link:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      alert(`Failed to generate recovery link: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(recoveryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmAndSendEmail = async () => {
    if (!sendEmail) {
      alert('Please confirm that you want to send the email');
      return;
    }
    await handleGenerateLink();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content password-recovery-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔐 Password Recovery</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {step === 'confirm' ? (
            <>
              <div className="recovery-user-info">
                <div className="user-avatar-small">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.username} />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3>{user.nickName || user.username}</h3>
                  <p className="user-email">{user.email}</p>
                </div>
              </div>

              <div className="recovery-description">
                <p>
                  Generate a password recovery link for this user. The link will be valid for <strong>1 hour</strong>.
                </p>
              </div>

              <div className="email-option">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                  />
                  <span>Send recovery link via email to <strong>{user.email}</strong></span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={sendEmail ? handleConfirmAndSendEmail : handleGenerateLink}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : sendEmail ? 'Generate & Send Email' : 'Generate Link'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="recovery-success">
                <div className="success-icon">✅</div>
                <h3>Recovery Link Generated!</h3>
              </div>

              {emailSent && (
                <div className="email-status success">
                  <span>📧</span>
                  <p>Email sent successfully to <strong>{user.email}</strong></p>
                </div>
              )}

              {emailError && (
                <div className="email-status error">
                  <span>⚠️</span>
                  <p>Failed to send email: {emailError}</p>
                  <p className="note">You can still copy the link below and send it manually.</p>
                </div>
              )}

              {!emailSent && !emailError && (
                <div className="email-status info">
                  <span>ℹ️</span>
                  <p>Recovery link generated. Copy the link below to share with the user.</p>
                </div>
              )}

              <div className="recovery-link-container">
                <div className="link-box">
                  <code>{recoveryUrl}</code>
                </div>
                <button
                  className="btn-copy"
                  onClick={handleCopyLink}
                >
                  {copied ? '✓ Copied!' : '📋 Copy Link'}
                </button>
              </div>

              <div className="recovery-info">
                <p>⏰ This link will expire in <strong>1 hour</strong></p>
                <p>🔐 The user can use this link to set a new password</p>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-primary"
                  onClick={onSuccess}
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Users;
