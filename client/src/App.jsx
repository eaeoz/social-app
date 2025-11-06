import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [serverStatus, setServerStatus] = useState('Checking...');

  useEffect(() => {
    // Check server health
    fetch(`${API_URL.replace('/api', '')}/health`)
      .then(res => res.json())
      .then(data => {
        setServerStatus(data.message);
      })
      .catch(err => {
        setServerStatus('Server offline');
        console.error('Health check failed:', err);
      });

    // Initialize Socket.IO connection
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 {import.meta.env.VITE_APP_NAME || 'Chat App'}</h1>
        
        <div className="status-container">
          <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="server-status">
            <strong>Server Status:</strong> {serverStatus}
          </div>
          
          {socket && (
            <div className="socket-id">
              <strong>Socket ID:</strong> {socket.id || 'Not connected'}
            </div>
          )}
        </div>

        <div className="info-box">
          <h2>✨ Features Ready:</h2>
          <ul>
            <li>✅ Backend server running</li>
            <li>✅ Socket.IO WebSocket connection</li>
            <li>✅ MongoDB database connected</li>
            <li>✅ Node-cache system active</li>
            <li>✅ Appwrite file storage configured</li>
          </ul>
        </div>

        <div className="next-steps">
          <h2>🎯 Next Steps:</h2>
          <ol>
            <li>Implement authentication system</li>
            <li>Create user registration/login</li>
            <li>Build public chat rooms</li>
            <li>Add private messaging</li>
            <li>Create user selection modal</li>
          </ol>
        </div>
      </header>
    </div>
  );
}

export default App;
