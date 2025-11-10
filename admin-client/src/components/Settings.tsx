import { useState, useEffect } from 'react';
import './Settings.css';

interface SiteSettings {
  allowUserPictures: boolean;
  maxMessageLength: number;
  rateLimit: number;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
}

function Settings() {
  const [settings, setSettings] = useState<SiteSettings>({
    allowUserPictures: true,
    maxMessageLength: 500,
    rateLimit: 10,
    maintenanceMode: false,
    registrationEnabled: true
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save settings.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
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
              <label>Allow User Profile Pictures</label>
              <span className="setting-description">
                Enable users to upload profile pictures
              </span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.allowUserPictures}
                onChange={(e) => setSettings({...settings, allowUserPictures: e.target.checked})}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Registration Enabled</label>
              <span className="setting-description">
                Allow new users to register
              </span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.registrationEnabled}
                onChange={(e) => setSettings({...settings, registrationEnabled: e.target.checked})}
              />
              <span className="toggle-slider"></span>
            </label>
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
                Maximum characters per message
              </span>
            </div>
            <input
              type="number"
              className="setting-input"
              value={settings.maxMessageLength}
              onChange={(e) => setSettings({...settings, maxMessageLength: parseInt(e.target.value)})}
              min="100"
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
