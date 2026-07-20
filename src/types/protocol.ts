export type ProtocolMessageType = 
  | 'PLUGIN_STATE_UPDATE'
  | 'FX_UPDATE'
  | 'MIDI_CC'
  | 'AUDIO_SYNC';

export interface BaseMessage {
  type: ProtocolMessageType;
  senderId: string;
  timestamp: number;
}

export interface PluginStateMessage extends BaseMessage {
  type: 'PLUGIN_STATE_UPDATE';
  pluginId: string;
  state: 'OFF' | 'AI_CONTROLLED' | 'ACTIVE';
}

export interface FXUpdateMessage extends BaseMessage {
  type: 'FX_UPDATE';
  fx_type: string;
  settings: { wetDry: number };
  sample_id?: string;
}

export type WebRTCMessage = PluginStateMessage | FXUpdateMessage;
