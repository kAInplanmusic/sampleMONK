// src/utils/StemRouter.ts
import { audioEngine } from './audioEngine';
import { TrackType } from '../types';

export const routeStemToMixer = (stemType: string, stemUrl: string) => {
    // Map stem type to mixer channel
    const mapping: Record<string, TrackType> = {
        'vocals': 'channel5',
        'drums': 'channel6',
        'bass': 'channel7',
        'other': 'channel8'
    };
    
    const channel = mapping[stemType] || 'channel8';
    audioEngine.loadTrackSample(channel, stemUrl);
    // console.log(`Routed ${stemType} stem to ${channel}`);
};
