import { io, Socket } from 'socket.io-client';
import { WebRTCMessage } from '../types/protocol';
import { SOCKET_IO_SIGNALING_URL } from '../config/runtime';

class WebRTCManager {
  private socket: Socket | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private localStream: MediaStream | null = null;
  private lastActivitySentAt = 0;
  public onRemoteStream: (stream: MediaStream, senderId: string) => void = () => {};
  public onDataChannelMessage: (message: any) => void = () => {};

  constructor() {
    // '' (empty string) means "same origin" — resolve to io() default so the
    // browser connects to the current host (works on Hetzner, Cloud Run, ...).
    if (SOCKET_IO_SIGNALING_URL !== null) {
      this.socket = io(SOCKET_IO_SIGNALING_URL || undefined, {
        // Der Express-Hauptserver (server.ts) mountet das WebRTC-Signaling
        // IMMER auf /webrtc-signaling – egal ob Dev (localhost:8080) oder
        // Prod (same-origin). Der Pfad ist daher fix, nur die URL variiert.
        path: '/webrtc-signaling',
        autoConnect: true,
        transports: ['websocket', 'polling'],
      });
      this.setupSignaling();
      this.setupActivityHeartbeat();
      this.initLocalAudio();
    }
  }

  private setupActivityHeartbeat() {
    if (typeof window === 'undefined') return;

    const signalActivity = () => {
      if (!this.socket?.connected) return;
      const now = Date.now();
      if (now - this.lastActivitySentAt < 60000) return;
      this.lastActivitySentAt = now;
      this.socket.emit('activity');
    };

    ['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
      window.addEventListener(eventName, signalActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') signalActivity();
    });
  }

  private async initLocalAudio() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error('Error accessing local audio:', err);
    }
  }

  private setupSignaling() {
    if (!this.socket) return;

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

    this.socket.on('connect_error', (error) => {
      console.warn('Signaling connection failed:', error.message);
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
      if (e.candidate) this.socket?.emit('ice-candidate', { target: targetId, candidate: e.candidate });
    };

    pc.ondatachannel = (e) => {
      this.dataChannels.set(targetId, e.channel);
      e.channel.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.type === 'CLOCK_PING') {
            e.channel.send(JSON.stringify({ type: 'CLOCK_PONG', pingTime: data.timestamp, pongTime: performance.now() }));
        }
        if (data.type === 'LATENCY_PING') {
            e.channel.send(JSON.stringify({ type: 'LATENCY_PONG', timestamp: data.timestamp }));
        }
        this.onDataChannelMessage(data);
        // console.log('Data from', targetId, data);
      };
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
    this.socket?.emit('offer', { target: targetId, offer });
  }

  public sendToAllPeers(data: WebRTCMessage) {
    this.dataChannels.forEach(channel => {
      if (channel.readyState === 'open') {
        channel.send(JSON.stringify(data));
      }
    });
  }

  public sendData(data: any) {
    this.sendToAllPeers(data as WebRTCMessage);
  }
}

export const webRTCManager = new WebRTCManager();
