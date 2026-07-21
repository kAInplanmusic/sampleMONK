import axios from 'axios';

// Backend API URL - can be configured via environment variables
const API_BASE_URL = 'http://localhost:8000/api'; 

export const useAudioAI = () => {
  
  const separateStems = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Note: The original backend expects a POST request.
    // Adjust based on the actual Python backend API implementation.
    const response = await axios.post(`${API_BASE_URL}/separate-stems`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  };

  const generateVoice = async (text: string, voicePreset: string) => {
    const response = await axios.post(`${API_BASE_URL}/generate-voice`, {
      text,
      voicePreset
    });
    return response.data;
  };

  return { separateStems, generateVoice };
};
