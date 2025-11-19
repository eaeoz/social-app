import { useState, useEffect } from 'react';
import './Settings.css';

interface CustomSchedule {
  _id: string;
  name: string;
  scriptPath: string;
  schedule: string;
  isActive: boolean;
  lastRun: string | null;
  runCount: number;
  createdAt: string;
}

function CustomSchedules() {
  const [schedules, setSchedules] = useState<CustomSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<CustomSchedule | null>(null);
  const [message, setMessage] = useState('');
  const [availableScripts, setAvailableScripts] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    scriptPath: 'exampleScript.js',
    schedule: 'every_minute'
  });

  useEffect(() => {
    fetchSchedules();
    fetchAvailableScripts();
  }, []);

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/custom-schedules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error fetching custom schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableScripts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/custom-schedules/available-scripts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableScripts(data.scripts || []);
      }
    } catch (error) {
      console.error('Error fetching available scripts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingSchedule
        ? `${import.meta.env.VITE_API_URL}/admin/custom-schedules/${editingSchedule._id}`
        : `${import.meta.env.VITE_API_URL}/admin/custom-schedules`;
      
      const response = await fetch(url, {
        method: editingSchedule ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          isActive: editingSchedule ? editingSchedule.isActive : true
        })
      });

      if (response.ok) {
        setMessage(editingSchedule ? 'Schedule updated successfully!' : 'Schedule created successfully!');
        setShowAddForm(false);
        setEditingSchedule(null);
        setFormData({ name: '', scriptPath: 'exampleScript.js', schedule: 'every_minute' });
        fetchSchedules();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to save schedule');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      setMessage('An error occurred while saving');
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/custom-schedules/${scheduleId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        setMessage('Schedule deleted successfully!');
        fetchSchedules();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setMessage('Failed to delete schedule');
    }
  };

  const handleEdit = (schedule: CustomSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      scriptPath: schedule.scriptPath,
      schedule: schedule.schedule
    });
    setShowAddForm(true);
  };

  const handleToggleActive = async (schedule: CustomSchedule) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/custom-schedules/${schedule._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: schedule.name,
            scriptPath: schedule.scriptPath,
            schedule: schedule.schedule,
            isActive: !schedule.isActive
          })
        }
      );

      if (response.ok) {
        fetchSchedules();
      }
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  const scheduleDescriptions: Record<string, string> = {
    'every_minute': 'Every Minute',
    'every_5_minutes': 'Every 5 Minutes',
    'every_hour': 'Every Hour',
    'every_12_hours': 'Every 12 Hours',
    'every_day': 'Daily at 3 AM',
    'every_week': 'Weekly (Sunday 3 AM)',
    'every_2_weeks': 'Twice Monthly',
    'every_month': 'Monthly'
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading custom schedules...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div>
          <h2>🤖 Custom Script Schedules</h2>
          <p style={{ color: '#666', fontSize: '0.9em', marginTop: '8px' }}>
            Manage automated script execution schedules
          </p>
        </div>
        <button 
          className="btn-save"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingSchedule(null);
            setFormData({ name: '', scriptPath: 'exampleScript.js', schedule: 'every_minute' });
          }}
        >
          {showAddForm ? '✖️ Cancel' : '➕ Add Schedule'}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {showAddForm && (
        <div className="setting-card" style={{ marginBottom: '20px' }}>
          <div className="setting-header">
            <h3>{editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}</h3>
            <p>Configure a new custom script schedule</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="setting-item">
              <div className="setting-info">
                <label>Schedule Name</label>
                <span className="setting-description">
                  A descriptive name for this schedule
                </span>
              </div>
              <input
                type="text"
                className="setting-input"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                placeholder="My Custom Task"
              />
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Script Path</label>
                <span className="setting-description">
                  Select a script from server/customSchedules/ folder
                </span>
              </div>
              <select
                className="setting-input"
                value={formData.scriptPath}
                onChange={(e) => setFormData({...formData, scriptPath: e.target.value})}
                required
              >
                {availableScripts.length === 0 ? (
                  <option value="">No scripts found</option>
                ) : (
                  availableScripts.map(script => (
                    <option key={script} value={script}>
                      {script}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Schedule</label>
                <span className="setting-description">
                  How often should this script run?
                </span>
              </div>
              <select
                className="setting-input"
                value={formData.schedule}
                onChange={(e) => setFormData({...formData, schedule: e.target.value})}
              >
                <option value="every_minute">Every Minute</option>
                <option value="every_5_minutes">Every 5 Minutes</option>
                <option value="every_hour">Every Hour</option>
                <option value="every_12_hours">Every 12 Hours (3 AM & 3 PM)</option>
                <option value="every_day">Daily (3 AM)</option>
                <option value="every_week">Weekly (Sunday 3 AM)</option>
                <option value="every_2_weeks">Twice Monthly (1st & 15th)</option>
                <option value="every_month">Monthly (1st at 3 AM)</option>
              </select>
            </div>

            <button type="submit" className="btn-save" style={{ marginTop: '16px' }}>
              💾 {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
            </button>
          </form>
        </div>
      )}

      {schedules.length === 0 ? (
        <div className="setting-card">
          <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            No custom schedules configured yet. Click "Add Schedule" to create one.
          </p>
        </div>
      ) : (
        <div className="settings-grid">
          {schedules.map(schedule => (
            <div key={schedule._id} className="setting-card">
              <div className="setting-header">
                <div>
                  <h3>{schedule.name}</h3>
                  <p style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>
                    📄 {schedule.scriptPath}
                  </p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={schedule.isActive}
                    onChange={() => handleToggleActive(schedule)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div style={{ padding: '16px', fontSize: '0.9em' }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong>⏰ Schedule:</strong> {scheduleDescriptions[schedule.schedule] || schedule.schedule}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>🔄 Run Count:</strong> {schedule.runCount} times
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>⏱️ Last Run:</strong> {formatDate(schedule.lastRun)}
                </div>
                <div style={{ marginBottom: '16px', color: '#666' }}>
                  <strong>📅 Created:</strong> {formatDate(schedule.createdAt)}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEdit(schedule)}
                    className="btn-save"
                    style={{ flex: 1, fontSize: '0.9em', padding: '8px' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(schedule._id)}
                    className="btn-save"
                    style={{ 
                      flex: 1, 
                      fontSize: '0.9em', 
                      padding: '8px',
                      background: '#dc3545'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="settings-footer">
        <p className="warning-text">
          ℹ️ Scripts are located in <code>server/customSchedules/</code> folder. 
          Create your script following the example pattern with an <code>execute()</code> function.
        </p>
      </div>
    </div>
  );
}

export default CustomSchedules;
