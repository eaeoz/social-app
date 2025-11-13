import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import './Cleanup.css';

interface User {
  _id: string;
  email: string;
  username: string;
  nickName?: string;
  age?: number;
  gender?: string;
  suspended?: boolean;
  isEmailVerified?: boolean;
  reportCount?: number;
}

interface StorageStats {
  storageSize: number;
  dataSize: number;
  indexSize: number;
  freeStorageSize: number;
  collections: number;
  objects: number;
}

interface SiteSettings {
  cleanMinSize?: number;
  cleanCycle?: number;
}

interface CleanupResult {
  success: boolean;
  cleanCycleDays: number;
  messagesBackup: {
    count: number;
    file: string | null;
  };
  privatechatsBackup: {
    count: number;
    file: string | null;
  };
  deleted: {
    messages: number;
    privatechats: number;
    total: number;
  };
  storageAfter: number;
}

interface BackupStats {
  totalSize: number;
  totalSizeKB: string;
  fileCount: number;
  organizedFolderCount: number;
}

function Cleanup() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [inactiveDays, setInactiveDays] = useState('');
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [storageLoading, setStorageLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null);

  useEffect(() => {
    fetchStorageStats();
    fetchSiteSettings();
    fetchBackupStats();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      fetchUsers();
    } else {
      setFilteredUsers([]);
    }
  }, [searchTerm]);

  const fetchStorageStats = async () => {
    setStorageLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/storage-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStorageStats(data);
      } else {
        console.error('Failed to fetch storage stats:', response.status);
      }
    } catch (error) {
      console.error('Error fetching storage stats:', error);
    } finally {
      setStorageLoading(false);
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSiteSettings(data.settings || {});
      } else {
        console.error('Failed to fetch site settings:', response.status);
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    }
  };

  const fetchBackupStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/cleanup/backup-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBackupStats(data);
      } else {
        console.error('Failed to fetch backup stats:', response.status);
      }
    } catch (error) {
      console.error('Error fetching backup stats:', error);
    }
  };

  const handleManualBackupCleanup = async () => {
    const cleanCycleMinutes = siteSettings.cleanCycle || 129600;
    const cleanCycleDays = (cleanCycleMinutes / 60 / 24).toFixed(1);
    
    if (!confirm(`🧹 Manual Backup & Cleanup\n\nThis will:\n• Backup messages older than ${cleanCycleMinutes} minutes (${cleanCycleDays} days) to JSON files\n• Delete the backed-up messages\n• Update storage statistics\n\nBackup files will be saved in server/backups/ directory.\n\nContinue?`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/cleanup/manual-backup-cleanup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Build success message
        let successMsg = `✅ Cleanup completed successfully!\n\n`;
        successMsg += `📦 Backed up:\n`;
        successMsg += `  • ${data.messagesBackup?.count || 0} messages${data.messagesBackup?.file ? ` → ${data.messagesBackup.file}` : ''}\n`;
        successMsg += `  • ${data.privatechatsBackup?.count || 0} private chats${data.privatechatsBackup?.file ? ` → ${data.privatechatsBackup.file}` : ''}\n\n`;
        successMsg += `🗑️ Deleted: ${data.deleted?.total || 0} total items\n`;
        successMsg += `💾 Storage after cleanup: ${data.storageAfter?.toFixed(2) || 'N/A'} MB`;
        
        setMessage(successMsg);
        
        // Refresh storage stats and backup stats
        await fetchStorageStats();
        await fetchBackupStats();
      } else {
        const error = await response.json();
        setMessage(`❌ Failed to perform cleanup: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error performing manual cleanup:', error);
      setMessage('❌ Error performing manual cleanup');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 15000);
    }
  };

  const handleDeleteOrganizedBackups = async () => {
    if (!confirm('🗑️ Delete Organized Backup Folders\n\nThis will delete all organized backup folders (folders starting with "organized_") while keeping the original backup JSON files.\n\nContinue?')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/cleanup/organized-backups`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Successfully deleted ${data.deleted || 0} organized backup folder(s)`);
        
        // Refresh backup stats
        await fetchBackupStats();
      } else {
        const error = await response.json();
        setMessage(`❌ Failed to delete organized backups: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting organized backups:', error);
      setMessage('❌ Error deleting organized backups');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleDeleteAllBackups = async () => {
    if (!confirm('🚨 DELETE ALL BACKUPS\n\n⚠️ WARNING: This will permanently delete ALL backup files in the server/backups/ directory!\n\nThis includes:\n• All backup JSON files\n• All organized backup folders\n• Everything in the backups directory\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?')) {
      return;
    }

    if (!confirm('🚨 FINAL WARNING\n\nClick OK to permanently delete ALL backups.\nThis is your last chance to cancel!')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/cleanup/all-backups`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Successfully deleted all backups: ${data.filesDeleted || 0} files, ${data.foldersDeleted || 0} folders`);
        
        // Refresh backup stats
        await fetchBackupStats();
      } else {
        const error = await response.json();
        setMessage(`❌ Failed to delete all backups: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting all backups:', error);
      setMessage('❌ Error deleting all backups');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

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
        
        if (usersList.length > 0) {
          console.log('First user sample:', {
            email: usersList[0].email,
            isEmailVerified: usersList[0].isEmailVerified,
            allFields: Object.keys(usersList[0])
          });
        }
        
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

  const handleCleanupAllUsersExceptAdmin = async () => {
    if (!confirm('☢️ EXTREME DANGER: Are you sure you want to delete ALL USERS (except admin "sedat") and ALL their data?\n\nThis will permanently delete:\n• All user accounts (except sedat)\n• All messages\n• All private chats\n• All reports\n• All profile pictures\n• All user data\n\nThis action CANNOT be undone!')) {
      return;
    }

    if (!confirm('⚠️ FINAL WARNING: Type "DELETE ALL USERS" in your mind and click OK if you really want to proceed with this IRREVERSIBLE action.')) {
      return;
    }

    if (!confirm('🚨 LAST CHANCE: This is your final opportunity to cancel. Click OK to DELETE ALL USERS AND DATA (keeping only admin "sedat").')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/cleanup/all-users-except-admin`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Successfully deleted ${data.stats?.usersDeleted || 0} users and all their data. Protected user: ${data.protectedUser}`);
        
        setFilteredUsers([]);
        setSelectedUser(null);
        setSearchTerm('');
      } else {
        const error = await response.json();
        setMessage(`❌ Failed to delete users: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting all users:', error);
      setMessage('❌ Error deleting all users');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 10000);
    }
  };

  const handleCleanupInactiveUsers = async () => {
    if (!inactiveDays || parseInt(inactiveDays) <= 0) {
      setMessage('❌ Please enter a valid number of days');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const days = parseInt(inactiveDays);

    if (!confirm(`⚠️ DANGER: Are you sure you want to delete ALL users inactive for ${days}+ days?\n\nThis will permanently delete:\n• All inactive user accounts (except admin "sedat")\n• All their messages (public and private)\n• All their profile pictures\n• All their reports (including archived reports)\n• All their data\n\nThis action CANNOT be undone!`)) {
      return;
    }

    if (!confirm(`🚨 FINAL WARNING: Click OK to delete all users who haven't logged in for ${days}+ days.`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/cleanup/inactive-users-and-old-data`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ inactiveDays: days }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Successfully deleted ${data.stats?.usersDeleted || 0} inactive users, ${data.stats?.messagesDeleted || 0} messages, and ${data.stats?.archivedReportsDeleted || 0} archived reports`);
        setInactiveDays('');
        
        setFilteredUsers([]);
        setSelectedUser(null);
        setSearchTerm('');
      } else {
        const error = await response.json();
        setMessage(`❌ Failed to delete inactive users: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting inactive users:', error);
      setMessage('❌ Error deleting inactive users');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 10000);
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

  const formatBytes = (bytes: number): string => {
    return (bytes / (1024 * 1024)).toFixed(2);
  };

  const getPieChartData = () => {
    if (!storageStats) return [];
    
    const data = [];
    
    // Data Used = Documents Data + Indexes Data
    const dataUsed = storageStats.dataSize + storageStats.indexSize;
    
    if (dataUsed > 0) {
      data.push({ name: 'Data Used', value: dataUsed, color: '#10b981' });
    }
    
    if (storageStats.freeStorageSize > 0) {
      data.push({ name: 'Available Space', value: storageStats.freeStorageSize, color: '#8b5cf6' });
    }
    
    return data;
  };

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && storageStats) {
      // Data Used = Documents Data + Indexes Data
      const dataUsed = storageStats.dataSize + storageStats.indexSize;
      const dataUsedPercent = ((dataUsed / storageStats.storageSize) * 100).toFixed(1);
      
      return (
        <div className="custom-tooltip">
          <p className="percentage">Data Used: {dataUsedPercent}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="cleanup-container">
      {storageLoading ? (
        <div className="storage-stats-section loading">
          <p>⏳ Loading storage statistics...</p>
        </div>
      ) : storageStats ? (
        <div className="storage-stats-section">
          <h3>💾 MongoDB Storage Overview</h3>
          <div className="storage-content">
            <div className="storage-chart">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getPieChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getPieChartData().map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry: any) => {
                      const percent = ((entry.payload.value / storageStats!.storageSize) * 100).toFixed(1);
                      return `${value} (${percent}%)`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="storage-details">
              <div className="storage-stat">
                <span className="stat-label">Total Used:</span>
                <span className="stat-value">{formatBytes(storageStats.storageSize)} MB</span>
              </div>
              <div className="storage-stat">
                <span className="stat-label">Documents Data:</span>
                <span className="stat-value">{formatBytes(storageStats.dataSize)} MB</span>
              </div>
              <div className="storage-stat">
                <span className="stat-label">Indexes Data:</span>
                <span className="stat-value">{formatBytes(storageStats.indexSize)} MB</span>
              </div>
              {storageStats.freeStorageSize > 0 && (
                <div className="storage-stat">
                  <span className="stat-label">Available Space:</span>
                  <span className="stat-value">{formatBytes(storageStats.freeStorageSize)} MB</span>
                </div>
              )}
              <div className="storage-stat">
                <span className="stat-label">Collections:</span>
                <span className="stat-value">{storageStats.collections}</span>
              </div>
              <div className="storage-stat">
                <span className="stat-label">Total Objects:</span>
                <span className="stat-value">{storageStats.objects.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="storage-stats-section automated-cleanup-section">
        <h3>🤖 Automated Backup & Cleanup</h3>
        <div className="automated-cleanup-content">
          <div className="cleanup-settings-info">
            <div className="setting-item">
              <span className="setting-label">📦 Clean Cycle:</span>
              <span className="setting-value">{siteSettings.cleanCycle || 129600} minutes ({((siteSettings.cleanCycle || 129600) / 60 / 24).toFixed(1)} days)</span>
              <span className="setting-description">Messages older than this will be cleaned</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">💾 Auto-Clean Threshold:</span>
              <span className="setting-value">{((siteSettings.cleanMinSize || 1024) / 1024).toFixed(0)} MB ({siteSettings.cleanMinSize || 1024} KB)</span>
              <span className="setting-description">Automatic cleanup triggers when storage exceeds this</span>
            </div>
          </div>
          <div className="manual-cleanup-action">
            <p className="info-text">
              Click the button below to manually backup and delete messages older than {siteSettings.cleanCycle || 129600} minutes ({((siteSettings.cleanCycle || 129600) / 60 / 24).toFixed(1)} days).
              Backup files will be saved to <code>server/backups/</code> directory.
            </p>
            <div className="backup-stats">
              <div className="stat-item">
                <span className="stat-label">📁 Backup Folder Size:</span>
                <span className="stat-value">{backupStats?.totalSizeKB || '0.00'} KB</span>
              </div>
              {backupStats && backupStats.organizedFolderCount > 0 && (
                <div className="stat-item organized-warning">
                  <span className="stat-label">📂 Organized Folders:</span>
                  <span className="stat-value">{backupStats.organizedFolderCount}</span>
                </div>
              )}
            </div>
            <div className="cleanup-buttons-row">
              <button
                className="cleanup-btn backup-cleanup"
                onClick={handleManualBackupCleanup}
                disabled={loading}
              >
                {loading ? '⏳ Processing...' : '🧹 Manual Backup & Cleanup'}
              </button>
              {backupStats && backupStats.organizedFolderCount > 0 && (
                <button
                  className="cleanup-btn delete-organized"
                  onClick={handleDeleteOrganizedBackups}
                  disabled={loading}
                  title="Delete organized backup folders (keeps original JSON files)"
                >
                  {loading ? '⏳ Processing...' : '🗑️ Delete Organized Backups'}
                </button>
              )}
              {backupStats && parseFloat(backupStats.totalSizeKB) > 0 && (
                <button
                  className="cleanup-btn delete-all-backups"
                  onClick={handleDeleteAllBackups}
                  disabled={loading}
                  title="Delete ALL backup files (cannot be undone!)"
                >
                  {loading ? '⏳ Processing...' : '🗑️ Delete ALL Backups'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

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
                    <span className={`detail-badge ${user.isEmailVerified ? 'verified' : 'unverified'}`}>
                      {user.isEmailVerified ? '✉️ Verified' : '✉️ Unverified'}
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

        <div className="cleanup-section inactive-users-zone">
          <h3>🕒 Inactive Users Cleanup</h3>
          
          <div className="inactive-users-section">
            <h4>🗑️ Delete Inactive Users & Their Data</h4>
            <p className="warning-text">
              Delete all users who haven't logged in for a specified number of days.
              This will also delete their messages, profile pictures, and archived reports.
              Admin "sedat" will never be deleted.
            </p>
            <div className="inactive-cleanup-controls">
              <input
                type="number"
                className="days-input"
                placeholder="Enter number of days (e.g., 90)"
                value={inactiveDays}
                onChange={(e) => setInactiveDays(e.target.value)}
                min="1"
                disabled={loading}
              />
              <button
                className="cleanup-btn inactive-cleanup"
                onClick={handleCleanupInactiveUsers}
                disabled={loading || !inactiveDays}
              >
                {loading ? '⏳ Processing...' : '🗑️ Delete Inactive Users'}
              </button>
            </div>
          </div>
        </div>

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

          <div className="separator"></div>

          <div className="all-users-section">
            <h4>☢️ Delete All Users & Messages</h4>
            <p className="warning-text">
              ⚠️ EXTREME DANGER: This will permanently delete ALL USERS (except admin 'sedat') and ALL their data including messages, chats, reports, and profile pictures.
              This is the nuclear option and CANNOT be undone!
            </p>
            <button
              className="cleanup-btn nuclear"
              onClick={handleCleanupAllUsersExceptAdmin}
              disabled={loading}
            >
              {loading ? '⏳ Processing...' : '☢️ Delete ALL Users & Data (Keep Admin Only)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cleanup;
