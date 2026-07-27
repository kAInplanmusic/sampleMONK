import axios from 'axios';
import { useState, useEffect } from 'react';

// Backend API URL - can be configured via environment variables
const API_BASE_URL = 'http://localhost:8000/api'; 

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
