import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import * as Tone from 'tone';

// Define the shape of the context value
interface AudioContextType {
    startAudio: () => Promise<void>;
    audioContext: Tone.Context | null; // Expose Tone.context
}

const AudioContext = createContext<AudioContextType | null>(null);

// Central Worklet loading function
// Central Worklet loading function
const loadWorkletWithCache = async (workletConfig: { name: string, url: string, processorId: string, hash: string }) => {
    const cacheName = 'worklet-cache-v1'; // Define your cache name
    const cache = await caches.open(cacheName);
    
    // Construct a unique URL including the hash for cache busting/validation
    const hashedUrl = `${workletConfig.url}?v=${workletConfig.hash}`;
    let loadedFromCache = false;

    try {
        const cachedResponse = await cache.match(hashedUrl);

        if (cachedResponse) {
            console.log(`${workletConfig.name} (${workletConfig.processorId}) loaded from cache.`);
            loadedFromCache = true;
            const blob = await cachedResponse.blob();
            const blobUrl = URL.createObjectURL(blob);
            await Tone.context.audioWorklet.addModule(blobUrl);
        } else {
            console.log(`${workletConfig.name} (${workletConfig.processorId}) not in cache or hash mismatch. Fetching.`);
            const response = await fetch(hashedUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            await cache.put(hashedUrl, response.clone()); // Cache the new response with the hashed URL
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            await Tone.context.audioWorklet.addModule(blobUrl);
        }
    } catch (error) {
        console.error(`Error loading ${workletConfig.name} (${workletConfig.processorId}) with cache:`, error);
        // Re-throw to allow outer try/catch to handle fallback
        throw error; 
    }
};

const loadAllAudioWorklets = async () => {
    // Define a simple dummy processor in case loading fails
    const registerDummyProcessor = (processorId: string) => {
        // This is a minimal pass-through processor
        const dummyProcessorCode = `
            class DummyProcessor extends AudioWorkletProcessor {
                process(inputs, outputs) {
                    const input = inputs[0];
                    const output = outputs[0];
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
        return Tone.context.audioWorklet.addModule(blobUrl);
    };

    let manifest: { worklets: { id: string, url: string, hash: string }[] } | null = null;
    try {
        const response = await fetch('/plugin-manifest.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        manifest = await response.json();
        console.log("Loaded plugin manifest.");
    } catch (error) {
        console.error("Failed to load plugin-manifest.json:", error);
        // If manifest fails, we cannot cache/validate, so fallback to direct loading
        // or just log and proceed without caching. For now, log and return.
        return; // Cannot proceed without manifest for caching
    }

    const workletsConfigFromManifest = manifest?.worklets.map(w => ({
        name: w.id, // Using id as name for simplicity
        url: w.url,
        processorId: w.id,
        hash: w.hash
    })) || [];


    for (const worklet of workletsConfigFromManifest) {
        try {
            await loadWorkletWithCache(worklet);
            console.log(`${worklet.name} (${worklet.processorId}) loaded successfully.`);
        } catch (error) {
            console.error(`Failed to load ${worklet.name} from ${worklet.url} (with cache):`, error);
            try {
                await registerDummyProcessor(worklet.processorId);
                console.warn(`Registered dummy-processor as '${worklet.processorId}' for ${worklet.name}.`);
            } catch (fallbackError) {
                console.error(`Failed to register dummy-processor for ${worklet.name}:`, fallbackError);
            }
        }
    }
    
    console.log("Attempted to load all AudioWorklets.");
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
            
            // WebRTC Master Audio Receiver
            const pc = new RTCPeerConnection();
            peerConnectionRef.current = pc; // Store pc in ref
            pc.ontrack = (event) => {
                const stream = event.streams[0];
                const audio = new Audio();
                audio.srcObject = stream;
                audio.play();
            };

            // Function to handle signaling over network
            const performSignaling = async () => {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                
                // Persist local description
                localStorage.setItem('webrtcLocalDescription', JSON.stringify(pc.localDescription));

                let answer;
                // Feature detect WebTransport and attempt to use it for sending offer
                if (typeof WebTransport !== 'undefined') {
                    console.log("Attempting WebRTC signaling over WebTransport.");
                    try {
                        const wt = new WebTransport("https://localhost:8002/webrtc-signaling"); // Assuming a WebTransport server at :8002
                        await wt.ready;
                        console.log("WebTransport connection established.");

                        const writable = wt.createUnidirectionalStream();
                        const writer = writable.getWriter();
                        await writer.write(new TextEncoder().encode(JSON.stringify({
                            sdp: pc.localDescription?.sdp,
                            type: pc.localDescription?.type
                        })));
                        await writer.close(); // Close the stream after sending
                        
                        // For simplicity, for receiving the answer, we will still use HTTP fetch for now,
                        // or a more sophisticated WebTransport receive needs to be set up.
                        // For this task, we're focusing on WebTransport for signaling *transport*.

                        console.log("Offer sent via WebTransport. Fetching answer via HTTP fallback for now.");
                        const response = await fetch('http://localhost:8001/offer', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ sdp: pc.localDescription?.sdp, type: pc.localDescription?.type })
                        });
                        answer = await response.json();
                        wt.close(); // Close WebTransport connection

                    } catch (wtError) {
                        console.warn("WebTransport signaling failed, falling back to HTTP fetch for both offer and answer:", wtError);
                        // Fallback to HTTP fetch for both offer and answer if WebTransport fails
                        const response = await fetch('http://localhost:8001/offer', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ sdp: pc.localDescription?.sdp, type: pc.localDescription?.type })
                        });
                        answer = await response.json();
                    }
                } else {
                    console.log("WebTransport not supported, using HTTP fetch for signaling.");
                    // Existing HTTP fetch signaling
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

                console.log("High-Res Master Audio Stream Connected");
            };

            // Check for existing signaling state to attempt re-connection or quick start
            const storedLocalDescription = localStorage.getItem('webrtcLocalDescription');
            const storedRemoteDescription = localStorage.getItem('webrtcRemoteDescription');

            if (storedLocalDescription && storedRemoteDescription) {
                console.log("Attempting to restore WebRTC connection from stored state.");
                const localDesc = JSON.parse(storedLocalDescription);
                const remoteDesc = JSON.parse(storedRemoteDescription);
                
                try {
                    await pc.setLocalDescription(new RTCSessionDescription(localDesc));
                    await pc.setRemoteDescription(new RTCSessionDescription(remoteDesc));
                    console.log("WebRTC connection restored from stored state.");
                } catch (e) {
                    console.warn("Failed to restore WebRTC connection from stored state, performing full signaling.", e);
                    localStorage.removeItem('webrtcLocalDescription');
                    localStorage.removeItem('webrtcRemoteDescription');
                    await performSignaling(); // Fallback to full signaling if restore fails
                }
            } else {
                await performSignaling(); // Perform full signaling if no stored state
            }

            // Connection status monitoring
            const handleNetworkChange = async () => {
                if (navigator.onLine) {
                    console.log("App is online. Attempting WebRTC signaling.");
                    // If not already connected, try to perform signaling again
                    // Check iceConnectionState to avoid redundant signaling if already connected/checking
                    if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'checking') {
                        try {
                            await performSignaling();
                        } catch (e) {
                            console.error("Failed to re-establish WebRTC signaling after going online:", e);
                        }
                    }
                } else {
                    console.warn("App is offline. WebRTC signaling paused.");
                }
            };
            setNetworkChangeHandler(() => handleNetworkChange); // Store handler in state

            window.addEventListener('online', handleNetworkChange);
            window.addEventListener('offline', handleNetworkChange);

            isInitialized.current = true;
        }
    };

    // Cleanup useEffect for global event listeners and RTCPeerConnection
    useEffect(() => {
        return () => {
            if (networkChangeHandler) {
                window.removeEventListener('online', networkChangeHandler);
                window.removeEventListener('offline', networkChangeHandler);
                console.log("Removed WebRTC network change listeners.");
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                console.log("Closed WebRTC PeerConnection.");
            }
        };
    }, [networkChangeHandler]); // Depend on networkChangeHandler to ensure cleanup happens correctly

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
