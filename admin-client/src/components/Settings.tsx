import { useState, useEffect } from 'react';
import './Settings.css';

interface SiteSettings {
  allowUserPictures: boolean;
  maxMessageLength: number;
  rateLimit: number;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  showuserlistpicture: number;
  searchUserCount: number;
  defaultUsersDisplayCount: number;
  maxReportCount: number;
  siteEmail: string;
  sessionTimeout: number;
  cleanCycle: number;
  cleanMinSize: number;
  cleanCheck: string;
  articleCheck: string;
}

function Settings() {
  const [settings, setSettings] = useState<SiteSettings>({
    allowUserPictures: true,
    maxMessageLength: 500,
    rateLimit: 10,
    maintenanceMode: false,
    registrationEnabled: true,
    showuserlistpicture: 1,
    searchUserCount: 4,
    defaultUsersDisplayCount: 3,
    maxReportCount: 2,
    siteEmail: '',
    sessionTimeout: 10080,
    cleanCycle: 129600,
    cleanMinSize: 512000,
    cleanCheck: 'every_12_hours',
    articleCheck: 'every_minute'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('🔍 Fetching settings from:', `${import.meta.env.VITE_API_URL}/admin/settings`);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('📥 Fetch response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Settings fetched:', data);
        if (data.settings) {
          setSettings(data.settings);
        }
      } else {
        console.error('❌ Failed to fetch settings:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const token = localStorage.getItem('adminToken');
      console.log('💾 Saving settings to:', `${import.meta.env.VITE_API_URL}/admin/settings`);
      
      // Filter out MongoDB-specific fields that shouldn't be updated
      const { _id, settingType, createdAt, updatedAt, ...settingsToSave } = settings as any;
      
      console.log('📤 Settings data (filtered):', settingsToSave);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsToSave)
      });

      console.log('📥 Save response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Settings saved:', data);
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorData = await response.text();
        console.error('❌ Failed to save settings:', response.status, errorData);
        setMessage('Failed to save settings.');
      }
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      setMessage('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Site Settings</h2>
        <button 
          className="btn-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : '💾 Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="settings-grid">
        <div className="setting-card">
          <div className="setting-header">
            <h3>User Features</h3>
            <p>Configure user-related settings</p>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <label>Show User List Picture</label>
              <span className="setting-description">
                Show profile pictures in user list (1=enabled, 0=disabled)
              </span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.showuserlistpicture === 1}
                onChange={(e) => setSettings({...settings, showuserlistpicture: e.target.checked ? 1 : 0})}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Default Users Display Count</label>
              <span className="setting-description">
                Number of users to display by default in lists
              </span>
            </div>
            <input
              type="number"
              className="setting-input"
              value={settings.defaultUsersDisplayCount || 3}
              onChange={(e) => setSettings({...settings, defaultUsersDisplayCount: parseInt(e.target.value) || 3})}
              min="1"
              max="50"
            />
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Search User Count Limit</label>
              <span className="setting-description">
                Maximum number of users shown in search results
              </span>
            </div>
            <input
              type="number"
              className="setting-input"
              value={settings.searchUserCount || 4}
              onChange={(e) => setSettings({...settings, searchUserCount: parseInt(e.target.value) || 4})}
              min="1"
              max="50"
            />
          </div>
        </div>

        <div className="setting-card">
          <div className="setting-header">
            <h3>Message Settings</h3>
            <p>Configure messaging limits</p>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <label>Max Message Length</label>
              <span className="setting-description">
                Maximum characters per message (minimum: 30)
              </span>
            </div>
            <input
              type="number"
              className="setting-input"
              value={settings.maxMessageLength}
              onChange={(e) => setSettings({...settings, maxMessageLength: Math.max(30, parseInt(e.target.value) || 30)})}
              min="30"
              max="2000"
            />
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Rate Limit</label>
              <span className="setting-description">
                Messages per minute per user
              </span>
            </div>
            <input
              type="number"
              className="setting-input"
              value={settings.rateLimit}
              onChange={(e) => setSettings({...settings, rateLimit: parseInt(e.target.value)})}
              min="5"
              max="100"
            />
          </div>
        </div>

        <div className="setting-card">
          <div className="setting-header">
            <h3>System Settings</h3>
            <p>Configure system-wide options</p>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <label>Session Timeout (Minutes)</label>
              <span className="setting-description">
                How long users stay logged in (in minutes). Examples: 3 = 3 minutes, 1440 = 1 day, 10080 = 7 days.
              </span>
              <span className="setting-description" style={{ fontSize: '0.85em', color: '#666', marginTop: '4px', display: 'block' }}>
                Current: {Math.round((settings.sessionTimeout || 10080) / 60 / 24 * 10) / 10} days
              </span>
            </div>
            <input
              type="number"
              className="setting-input"
              value={settings.sessionTimeout || 10080}
              onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value) || 10080})}
              min="1"
              max="525600"
              placeholder="10080 (7 days)"
            />
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Site Email</label>
              <span className="setting-description">
                Admin contact email address for notifications (read-only)
              </span>
            </div>
            <input
              type="email"
              className="setting-input"
              value={settings.siteEmail || ''}
              onChange={(e) => setSettings({...settings, siteEmail: e.target.value})}
              placeholder="admin@example.com"
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Max Report Count</label>
              <span className="setting-description">
                Number of reports before user suspension
              </span>
            </div>
            <input
              type="number"
              className="setting-input"
              value={settings.maxReportCount || 2}
              onChange={(e) => setSettings({...settings, maxReportCount: parseInt(e.target.value) || 2})}
              min="1"
              max="20"
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <label>Maintenance Mode</label>
              <span className="setting-description">
                Put the site in maintenance mode
              </span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="setting-card">
          <div className="setting-header">
            <h3>🤖 Automated Cleanup Settings</h3>
            <p>Configure automatic backup and cleanup</p>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <label>Clean Cycle (Minutes)</label>
              <span className="setting-description">
                Messages older than this will be backed up and deleted. Examples: 43200 = 30 days, 129600 = 90 days
              </span>
              <span className="setting-description" style={{ fontSize: '0.85em', color: '#666', marginTop: '4px', display: 'block' }}>
                Current: {Math.round((settings.cleanCycle || 129600) / 60 / 24 * 10) / 10} days
              </span>
            </div>
            <input
              type="number"
              className="setting-input"
              value={settings.cleanCycle || 129600}
              onChange={(e) => setSettings({...settings, cleanCycle: parseInt(e.target.value) || 129600})}
              min="1440"
              max="525600"
              placeholder="129600 (90 days)"
            />
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Auto-Clean Threshold (KB)</label>
              <span className="setting-description">
                Automatic cleanup triggers when database storage exceeds this size (in kilobytes). Example: 1024 KB = 1 MB
              </span>
              <span className="setting-description" style={{ fontSize: '0.85em', color: '#666', marginTop: '4px', display: 'block' }}>
                Current: {((settings.cleanMinSize || 512000) / 1024).toFixed(2)} MB
              </span>
            </div>
            <input
              type="number"
              className="setting-input"
              value={settings.cleanMinSize || 512000}
              onChange={(e) => setSettings({...settings, cleanMinSize: parseInt(e.target.value) || 512000})}
              min="1024"
              max="10240000"
              placeholder="512000 (500 MB)"
            />
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>⏰ Cleanup Check Schedule</label>
              <span className="setting-description">
                How often the system checks if cleanup is needed (based on threshold and cycle settings)
              </span>
            </div>
            <select
              className="setting-input"
              value={settings.cleanCheck || 'every_12_hours'}
              onChange={(e) => setSettings({...settings, cleanCheck: e.target.value})}
            >
              <option value="every_minute">Every Minute (testing only)</option>
              <option value="every_5_minutes">Every 5 Minutes (testing only)</option>
              <option value="every_hour">Every Hour</option>
              <option value="every_12_hours">Every 12 Hours (3 AM & 3 PM)</option>
              <option value="every_day">Daily (3 AM)</option>
              <option value="every_week">Weekly (Sunday 3 AM)</option>
              <option value="every_2_weeks">Twice Monthly (1st & 15th at 3 AM)</option>
              <option value="every_month">Monthly (1st at 3 AM)</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>📝 Article Check Schedule</label>
              <span className="setting-description">
                How often the system checks for article-related updates or maintenance tasks
              </span>
            </div>
            <select
              className="setting-input"
              value={settings.articleCheck || 'every_minute'}
              onChange={(e) => setSettings({...settings, articleCheck: e.target.value})}
            >
              <option value="every_minute">Every Minute (testing only)</option>
              <option value="every_5_minutes">Every 5 Minutes (testing only)</option>
              <option value="every_hour">Every Hour</option>
              <option value="every_12_hours">Every 12 Hours (3 AM & 3 PM)</option>
              <option value="every_day">Daily (3 AM)</option>
              <option value="every_week">Weekly (Sunday 3 AM)</option>
              <option value="every_2_weeks">Twice Monthly (1st & 15th at 3 AM)</option>
              <option value="every_month">Monthly (1st at 3 AM)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-footer">
        <p className="warning-text">
          ⚠️ Changes will take effect immediately after saving.
        </p>
      </div>
    </div>
  );
}

export default Settings;
