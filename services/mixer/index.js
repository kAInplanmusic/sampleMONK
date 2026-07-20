const wrtc = require('wrtc');
const io = require('socket.io-client');

const socket = io('http://localhost:3001');

const peerConnections = new Map();

socket.on('offer', async (data) => {
    console.log('Received offer from:', data.sender);
    const pc = new wrtc.RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('ice-candidate', { target: data.sender, candidate: e.candidate });
    };

    pc.ontrack = (e) => {
        console.log('Received audio track from:', data.sender);
        // Mixer Logic: Route this track to all other peers
        broadcastTrack(e.track, e.streams[0], data.sender);
    };

    await pc.setRemoteDescription(new wrtc.RTCSessionDescription(data.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer', { target: data.sender, answer });
    
    peerConnections.set(data.sender, pc);
});

function broadcastTrack(track, stream, senderId) {
    peerConnections.forEach((pc, id) => {
        if (id !== senderId) {
            pc.addTrack(track, stream);
        }
    });
}
