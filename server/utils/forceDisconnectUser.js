import { io } from '../server.js';

/**
 * Force disconnect a user from all their active socket connections
 * This should be called when a user account is deleted
 * @param {string} userId - The user ID to disconnect
 * @param {string} reason - Reason for disconnection
 */
export function forceDisconnectUser(userId, reason = 'User account deleted') {
  try {
    // Get all connected sockets
    const sockets = io.sockets.sockets;
    
    let disconnectedCount = 0;
    
    // Iterate through all sockets and disconnect those belonging to the user
    for (const [socketId, socket] of sockets) {
      if (socket.userId === userId) {
        console.log(`🔌 Forcing disconnect for user ${userId} (socket: ${socketId})`);
        
        // Emit force logout event before disconnecting
        socket.emit('force_logout', { reason });
        
        // Disconnect the socket
        socket.disconnect(true);
        
        disconnectedCount++;
      }
    }
    
    if (disconnectedCount > 0) {
      console.log(`✅ Disconnected ${disconnectedCount} socket(s) for user ${userId}`);
    } else {
      console.log(`ℹ️ No active connections found for user ${userId}`);
    }
    
    return disconnectedCount;
  } catch (error) {
    console.error('Error force disconnecting user:', error);
    return 0;
  }
}
