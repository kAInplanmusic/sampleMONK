/**
 * audioMONASTRY · SFU-Transport via Mediasoup (Aufg. 3.1.1 / 1.1.6)
 * -----------------------------------------------------------------
 * Skalierbarer SFU-Modus: Der Browser verbindet sich als mediasoup-client
 * gegen eine Mediasoup-SFU. Statt eines Full-Mesh (jeder mit jedem) routers
 * der SFU die Media-Streams – damit ist die Architektur für 10+ Benutzer
 * skalierbar.
 *
 * CLIENT-Transport-Abstraktion hinter `ITransport`. Nutzt socket.io-client
 * für die Signalisierung gegen den /sfu-signaling-Endpoint des Backends.
 */
import { io, Socket } from 'socket.io-client';
import { Device } from 'mediasoup-client';
import { ITransport, TransportMode } from '../interfaces';

export interface SfuOptions {
  sessionId?: string;
  handshake?: Record<string, unknown>;
}

export class MediasoupTransport implements ITransport {
  readonly id = 'mediasoup-sfu';
  readonly mode: TransportMode = 'sfu';

  private socket: Socket | null = null;
  private device: Device | null = null;
  private transport: any = null;
  private producers = new Map<string, any>();
  private consumers = new Map<string, any>();
  private _onMessage: (payload: unknown, fromPeerId: string) => void = () => {};
  private _onPeerJoin: (peerId: string) => void = () => {};
  private _onPeerLeave: (peerId: string) => void = () => {};

  onMessage: ITransport['onMessage'] = (cb) => { this._onMessage = cb; };
  onPeerJoin: ITransport['onPeerJoin'] = (cb) => { this._onPeerJoin = cb; };
  onPeerLeave: ITransport['onPeerLeave'] = (cb) => { this._onPeerLeave = cb; };

  async connect(sessionId: string, _userId: string, opts?: SfuOptions): Promise<void> {
    this.socket = io({
      path: '/sfu-signaling',
      query: { sessionId: opts?.sessionId ?? sessionId },
    });
    await new Promise<void>((resolve, reject) => {
      this.socket!.on('connect', resolve);
      this.socket!.on('connect_error', reject);
    });

    this.device = new Device();
    const routerRtpCapabilities = await this.signal('getRouterRtpCapabilities');
    await this.device.load({ routerRtpCapabilities: routerRtpCapabilities.rtpCapabilities });

    const dir = await this.signal('createTransport', { direction: 'send' });
    this.transport = this.device.createSendTransport(dir);
    this.transport.on('connect', async ({ dtlsParameters }: any) => {
      await this.signal('connectTransport', { transportId: this.transport.id, dtlsParameters });
    });
    this.transport.on('produce', async (params: any, callback: any, errback: any) => {
      try {
        const { id } = await this.signal('produce', { transportId: this.transport.id, ...params });
        callback({ id });
      } catch (e) { errback(e); }
    });
    this.socket.on('data', (payload: unknown, fromPeerId: string) => this._onMessage(payload, fromPeerId));
    this._onPeerJoin('local');
  }

  disconnect(): void {
    this.producers.forEach((p) => p.close());
    this.consumers.forEach((c) => c.close());
    this.producers.clear();
    this.consumers.clear();
    this.transport?.close();
    this.device = null;
    this.socket?.disconnect();
    this.socket = null;
  }

  broadcast(payload: unknown): void { this.socket?.emit('data', payload); }
  sendTo(_peerId: string, payload: unknown): void { this.broadcast(payload); }
  syncClock(): void { /* RTC-Tracks tragen die Audio-Zeitachse. */ }

  /** Lokalen Audio-Stream als Producer dem SFU-Router anbieten. */
  async sendAudioTrack(track: MediaStreamTrack): Promise<void> {
    if (!this.transport) throw new Error('SFU send-transport nicht bereit');
    const producer = await this.transport.produce({ track });
    this.producers.set(track.id, producer);
  }

  /** Fremden Audio-Stream (via producer) konsumieren und seinen Track liefern. */
  async subscribeToPeer(producerId: string): Promise<MediaStreamTrack | null> {
    if (!this.transport || !this.device) return null;
    const { id, kind, rtpParameters } = await this.signal('consume', {
      transportId: this.transport.id, producerId, rtpCapabilities: this.device.rtpCapabilities,
    });
    const consumer = await this.transport.consume({ id, producerId, kind, rtpParameters });
    this.consumers.set(producerId, consumer);
    return consumer.track;
  }

  /** Socket.io call-basiertes Signalisieren (Server antwortet mit callback). */
  private signal(event: string, payload?: unknown): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) return reject(new Error('SFU signaling nicht verbunden'));
      this.socket.emit(event, payload ?? {}, (resp: any) => {
        if (!resp) return reject(new Error(`SFU-Signal ohne Antwort: ${event}`));
        if (resp.error) return reject(new Error(resp.error));
        resolve(resp);
      });
    });
  }
}

/** Der standardmäßige SFU-Adapter (genutzt, sobald SFU-Server erreichbar ist). */
export const sfuTransport = new MediasoupTransport();

