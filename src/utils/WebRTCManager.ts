import { io, Socket } from 'socket.io-client';

class WebRTCManager {
  private socket: Socket;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private localStream: MediaStream | null = null;
  public onRemoteStream: (stream: MediaStream, senderId: string) => void = () => {};

  constructor() {
    this.socket = io('http://localhost:3001');
    this.setupSignaling();
    this.initLocalAudio();
  }

  private async initLocalAudio() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error('Error accessing local audio:', err);
    }
  }

  private setupSignaling() {
    this.socket.on('offer', async (data) => {
      const pc = this.createPeerConnection(data.sender);
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.socket.emit('answer', { target: data.sender, answer });
    });

    this.socket.on('answer', async (data) => {
      const pc = this.peerConnections.get(data.sender);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    this.socket.on('ice-candidate', (data) => {
      const pc = this.peerConnections.get(data.sender);
      if (pc) pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    });
  }

  private createPeerConnection(targetId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Add local tracks
    if (this.localStream) {
        this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream!));
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) this.socket.emit('ice-candidate', { target: targetId, candidate: e.candidate });
    };

    pc.ondatachannel = (e) => {
      this.dataChannels.set(targetId, e.channel);
      e.channel.onmessage = (msg) => console.log('Data from', targetId, msg.data);
    };

    pc.ontrack = (e) => {
        this.onRemoteStream(e.streams[0], targetId);
    };

    this.peerConnections.set(targetId, pc);
    return pc;
  }

  public async connectToPeer(targetId: string) {
    const pc = this.createPeerConnection(targetId);
    const dc = pc.createDataChannel('plugin-sync');
    this.dataChannels.set(targetId, dc);
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.socket.emit('offer', { target: targetId, offer });
  }

  public sendToAllPeers(data: any) {
    this.dataChannels.forEach(channel => {
      if (channel.readyState === 'open') {
        channel.send(JSON.stringify(data));
      }
    });
  }
}

export const webRTCManager = new WebRTCManager();
