import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import * as Tone from 'tone';

// Define the shape of the context value
interface AudioContextType {
    startAudio: () => Promise<void>;
    audioContext: Tone.Context | null; // Expose Tone.context
}

const AudioContext = createContext<AudioContextType | null>(null);

const loadAllAudioWorklets = async () => {
    // Define a simple dummy processor in case loading fails
    const registerDummyProcessor = (processorId: string) => {
        // This is a minimal pass-through processor
        const dummyProcessorCode = `
            class DummyProcessor extends AudioWorkletProcessor {
                process(inputs, outputs) {
                    const input = inputs[0];
                    const output = outputs[0];
                    if (!input || !input[0]) return true;
                    for (let channel = 0; channel < input.length; ++channel) {
                        output[channel].set(input[channel]);
                    }
                    return true;
                }
            }
            registerProcessor('${processorId}', DummyProcessor);
        `;
        const blob = new Blob([dummyProcessorCode], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        const rawCtx = Tone.context.rawContext as AudioContext;
        return rawCtx.audioWorklet.addModule(blobUrl);
    };

    let manifest: { worklets: { id: string, url: string, hash: string }[] } | null = null;
    try {
        const response = await fetch('/plugin-manifest.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        manifest = await response.json();
        // console.log("Loaded plugin manifest.");
    } catch (error) {
        console.error("Failed to load plugin-manifest.json:", error);
        return;
    }

    const workletsConfigFromManifest = manifest?.worklets.map(w => ({
        name: w.id, 
        url: w.url,
        processorId: w.id,
        hash: w.hash
    })) || [];

    const rawCtx = Tone.context.rawContext as AudioContext;

    for (const worklet of workletsConfigFromManifest) {
        try {
            await rawCtx.audioWorklet.addModule(worklet.url);
            // console.log(`${worklet.name} (${worklet.processorId}) loaded successfully from ${worklet.url}.`);
        } catch (error) {
            console.error(`Failed to load ${worklet.name} from ${worklet.url}:`, error);
            try {
                await registerDummyProcessor(worklet.processorId);
                console.warn(`Registered dummy-processor as '${worklet.processorId}' for ${worklet.name}.`);
            } catch (fallbackError) {
                console.error(`Failed to register dummy-processor for ${worklet.name}:`, fallbackError);
            }
        }
    }
    
    // console.log("Attempted to load all AudioWorklets.");
};

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
    const isInitialized = useRef(false);
    const audioContextRef = useRef<Tone.Context | null>(null); // To store Tone.context
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null); // To store RTCPeerConnection

    // State to hold the handleNetworkChange function so it can be removed
    const [networkChangeHandler, setNetworkChangeHandler] = useState<(() => Promise<void>) | null>(null);

    const startAudio = async () => {
        if (!isInitialized.current) {
            await Tone.start();
            audioContextRef.current = Tone.context; // Store Tone.context

            // Load all necessary Worklets
            await loadAllAudioWorklets();
            
            // Core Timing System
            Tone.Transport.bpm.value = 120;
            Tone.Transport.start();
            
            // WebRTC Master Audio Receiver with ICE/TURN fallback
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ]
            });
            peerConnectionRef.current = pc;

            // State Synchronization via DataChannel
            pc.ondatachannel = (event) => {
                const receiveChannel = event.channel;
                receiveChannel.onmessage = (msg) => {
                    try {
                        const stateUpdate = JSON.parse(msg.data);
                        // console.log("WebRTC State Sync Received:", stateUpdate);
                    } catch (e) {
                        console.error("Failed to parse state sync message:", e);
                    }
                };
            };

            pc.ontrack = (event) => {
                const stream = event.streams[0];
                
                // Integrate into Tone.js Signal Chain
                const audioCtx = Tone.context.rawContext as AudioContext;
                const sourceNode = audioCtx.createMediaStreamSource(stream);
                
                // Connect to Tone's master destination (or your custom chain)
                const toneSource = Tone.context.createMediaStreamSource(stream);
                // Connect to master output to enable processing
                (toneSource as any).connect(Tone.Destination);
                
                console.log("High-Res Master Audio Stream connected to Tone.js Graph");
            };

            // Function to handle signaling over network
            const performSignaling = async () => {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                
                // Persist local description
                localStorage.setItem('webrtcLocalDescription', JSON.stringify(pc.localDescription));

                let answer;
                // Feature detect WebTransport and attempt to use it for sending offer
                if (typeof (window as any).WebTransport !== 'undefined') {
                    // console.log("Attempting WebRTC signaling over WebTransport.");
                    try {
                        const wt = new (window as any).WebTransport("https://localhost:8002/webrtc-signaling");
                        await wt.ready;
                        // console.log("WebTransport connection established.");

                        const writable = await wt.createUnidirectionalStream();
                        const writer = writable.getWriter();
                        await writer.write(new TextEncoder().encode(JSON.stringify({
                            sdp: pc.localDescription?.sdp,
                            type: pc.localDescription?.type
                        })));
                        await writer.close(); 
                        
                        // console.log("Offer sent via WebTransport. Fetching answer via HTTP fallback for now.");
                        const response = await fetch('http://localhost:8001/offer', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ sdp: pc.localDescription?.sdp, type: pc.localDescription?.type })
                        });
                        answer = await response.json();
                        wt.close(); 

                    } catch (wtError) {
                        console.warn("WebTransport signaling failed, falling back to HTTP fetch:", wtError);
                        const response = await fetch('http://localhost:8001/offer', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ sdp: pc.localDescription?.sdp, type: pc.localDescription?.type })
                        });
                        answer = await response.json();
                    }
                } else {
                    // console.log("WebTransport not supported, using HTTP fetch.");
                    const response = await fetch('http://localhost:8001/offer', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ sdp: pc.localDescription?.sdp, type: pc.localDescription?.type })
                    });
                    answer = await response.json();
                }

                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                // Persist remote description
                localStorage.setItem('webrtcRemoteDescription', JSON.stringify(answer));

                // console.log("High-Res Master Audio Stream Connected");
            };

            // Check for existing signaling state
            const storedLocalDescription = localStorage.getItem('webrtcLocalDescription');
            const storedRemoteDescription = localStorage.getItem('webrtcRemoteDescription');

            if (storedLocalDescription && storedRemoteDescription) {
                // console.log("Attempting to restore WebRTC connection.");
                const localDesc = JSON.parse(storedLocalDescription);
                const remoteDesc = JSON.parse(storedRemoteDescription);
                
                try {
                    await pc.setLocalDescription(new RTCSessionDescription(localDesc));
                    await pc.setRemoteDescription(new RTCSessionDescription(remoteDesc));
                    // console.log("WebRTC connection restored.");
                } catch (e) {
                    console.warn("Failed to restore WebRTC connection, performing full signaling.", e);
                    localStorage.removeItem('webrtcLocalDescription');
                    localStorage.removeItem('webrtcRemoteDescription');
                    await performSignaling(); 
                }
            } else {
                await performSignaling(); 
            }

            // Connection status monitoring
            const handleNetworkChange = async () => {
                if (navigator.onLine) {
                    if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'checking') {
                        try {
                            await performSignaling();
                        } catch (e) {
                            console.error("Failed to re-establish WebRTC signaling:", e);
                        }
                    }
                }
            };
            setNetworkChangeHandler(() => handleNetworkChange);

            window.addEventListener('online', handleNetworkChange);
            window.addEventListener('offline', handleNetworkChange);

            isInitialized.current = true;
        }
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (networkChangeHandler) {
                window.removeEventListener('online', networkChangeHandler);
                window.removeEventListener('offline', networkChangeHandler);
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
        };
    }, [networkChangeHandler]);

    return (
        <AudioContext.Provider value={{ startAudio, audioContext: audioContextRef.current }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) throw new Error("useAudio must be used within AudioProvider");
    return context;
};
