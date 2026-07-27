import axios from 'axios';

// Backend API URL - can be configured via environment variables
const API_BASE_URL = 'http://localhost:8000/api'; 

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
        
        // Simulating stream progress
        for(let i=10; i<=100; i+=10) {
            await new Promise(r => setTimeout(r, 200));
            yield i;
        }
        
        return {
            status: 'success',
            stems: {
                vocals: 'mock_url_vocals',
                melody: 'mock_url_melody',
                highs: 'mock_url_highs',
                mids: 'mock_url_mids',
                lows: 'mock_url_lows'
            }
        };
    } catch (error) {
        console.warn("AI service unreachable, using mock fallback.");
        yield 100;
        return { status: 'mocked', stems: {} };
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
    return await fetchWithRetry(async () => {
        const response = await axios.post(`${API_BASE_URL}/generate-voice`, {
          text,
          voicePreset
        });
        return response.data;
    });
  };

  return { separateStems, streamStems, generateVoice };
};
