import axios from 'axios';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/runtime';

export const useAIStatus = () => {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                await axios.get(`${API_BASE_URL}/health`, { timeout: 2000 });
                setIsOnline(true);
            } catch (e) {
                setIsOnline(false);
            }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    return { isOnline };
};

export const useAudioAI = () => {
  
  const fetchWithRetry = async (apiCall: () => Promise<any>, retries = 3): Promise<any> => {
    for (let i = 0; i < retries; i++) {
        try {
            return await apiCall();
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000)); // Exponential backoff
        }
    }
  };

  const streamStems = async function* (file: File) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE_URL}/separate-stems`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.body) throw new Error("No response body");
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            // Handle SSE lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || "";
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = JSON.parse(line.slice(6));
                    if (data.progress) yield data.progress;
                    if (data.status === 'success') return { status: 'success', stems: data.stems };
                }
            }
        }
    } catch (error) {
        console.warn("AI service unreachable, using mock fallback.", error);
        // Simulate progress
        for(let i=10; i<=100; i+=10) {
            await new Promise(r => setTimeout(r, 200));
            yield i;
        }
        return {
            status: 'mocked',
            stems: {
                vocals: 'mock_url_vocals',
                melody: 'mock_url_melody',
                highs: 'mock_url_highs',
                mids: 'mock_url_mids',
                lows: 'mock_url_lows'
            }
        };
    }
  };

  const separateStems = async (file: File) => {
    // Legacy support
    const stream = streamStems(file);
    let last;
    for await (const val of stream) { last = val; }
    return last;
  };

  const generateVoice = async (text: string, voicePreset: string) => {
    // Task 13: Vorzug für lokale Web-Speech-Synthese (keine Server-Abhängigkeit).
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const synth = window.speechSynthesis;
        if (synth && synth.getVoices().length > 0) {
          // Kurzwort zur Laufzeit auswählen (Einzelsatz), Anbieter darf blockiert sein.
          const speak = new Promise<string>((resolve) => {
            const utter = new SpeechSynthesisUtterance(text);
            const voices = synth.getVoices();
            // Wähle eine deutsche/en-US-Stimme bevorzugt
            const match = voices.find(v => v.lang === voicePreset) || voices[0];
            if (match) utter.voice = match;
            utter.rate = 0.95;
            utter.onend = () => resolve('ok-spoken');
            utter.onerror = () => resolve('error-speech');
            synth.speak(utter);
          });
          await Promise.race([speak, new Promise(r => setTimeout(r, 1200))]); // kurzer Timeout
          return { status: 'spoken', url: null, text };
        }
      } catch (e) {
        console.warn('Web-Speech nicht verfügbar, weiter mit Server.', e);
      }
    }

    try {
      return await fetchWithRetry(async () => {
          const response = await axios.post(`${API_BASE_URL}/generate-voice`, {
            text,
            voicePreset
          });
          return response.data;
      });
    } catch (error) {
      console.warn("Voice generation service unreachable, using mock fallback.", error);
      return {
          status: 'mocked',
          url: `mock_voice_url_${voicePreset}`,
          text
      };
    }
  };

  return { separateStems, streamStems, generateVoice };
};
