import React, { createContext, useContext, useRef } from 'react';
import * as Tone from 'tone';

const AudioContext = createContext<{ startAudio: () => Promise<void> } | null>(null);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
    const isInitialized = useRef(false);

    const startAudio = async () => {
        if (!isInitialized.current) {
            await Tone.start();
            
            // Core Timing System
            Tone.Transport.bpm.value = 120;
            Tone.Transport.start();
            
            // WebRTC Master Audio Receiver
            const pc = new RTCPeerConnection();
            pc.ontrack = (event) => {
                const stream = event.streams[0];
                const audio = new Audio();
                audio.srcObject = stream;
                audio.play();
            };
            
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            // Send offer to master-player and receive answer
            const response = await fetch('http://localhost:8001/offer', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ sdp: pc.localDescription?.sdp, type: pc.localDescription?.type })
            });
            const answer = await response.json();
            await pc.setRemoteDescription(new RTCSessionDescription(answer));

            console.log("High-Res Master Audio Stream Connected");
            isInitialized.current = true;
        }
    };

    return (
        <AudioContext.Provider value={{ startAudio }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) throw new Error("useAudio must be used within AudioProvider");
    return context;
};
