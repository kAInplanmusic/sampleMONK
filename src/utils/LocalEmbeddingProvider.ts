// src/utils/LocalEmbeddingProvider.ts

/**
 * Mock provider for local ONNX-based embeddings.
 * In a real implementation, this would use @xenova/transformers to generate vectors locally.
 */
export const generateLocalEmbedding = async (text: string): Promise<number[]> => {
    // console.log(`Generating local embedding for: ${text}`);
    // Simulate async generation time
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Return a mock vector of size 384 (common for MiniLM)
    return Array.from({ length: 384 }, () => Math.random() * 2 - 1);
};

export const isLocalEmbeddingAvailable = () => {
    // Check if the feature is enabled via env var
    return process.env.VITE_ENABLE_LOCAL_EMBEDDINGS === 'true';
};
