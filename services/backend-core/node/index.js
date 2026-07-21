const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// State-Management
const clients = new Map(); // userId -> ws
const lockState = new Map(); // moduleId -> userId

function broadcast(msg) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(msg));
    }
  });
}

wss.on('connection', (ws) => {
  let userId = null;

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error('Invalid message format:', e);
      return;
    }

    // 1. Initialisierung (User ID setzen)
    if (data.type === 'init') {
      userId = data.sender;
      clients.set(userId, ws);
      console.log(`User ${userId} joined.`);
    }

    // 2. WebRTC Signaling (Routing)
    else if (['sdp_offer', 'sdp_answer', 'ice_candidate'].includes(data.type)) {
      const recipientWs = clients.get(data.recipient);
      if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
        recipientWs.send(message);
      }
    }

    // 3. Locking Logic (Synchronisation)
    else if (data.type === 'lock_request') {
      const { moduleId } = data.payload;
      if (!lockState.has(moduleId)) {
        lockState.set(moduleId, userId);
        broadcast({ 
          type: 'lock_status', 
          sender: 'server',
          payload: { moduleId, userId, status: 'locked' } 
        });
      }
    }
  });

  ws.on('close', () => {
    if (userId) {
      console.log(`User ${userId} left.`);
      clients.delete(userId);
      // Cleanup Locks
      for (const [moduleId, ownerId] of lockState.entries()) {
        if (ownerId === userId) {
          lockState.delete(moduleId);
          broadcast({ 
            type: 'lock_status', 
            sender: 'server',
            payload: { moduleId, userId: null, status: 'unlocked' } 
          });
        }
      }
    }
  });
});

console.log('Signaling server running on ws://localhost:8080');
