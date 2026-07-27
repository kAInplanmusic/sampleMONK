# SLM Integration Plan: localVOICE & localLLM

## Goal
Integrate Small Language Models (SLMs) to allow offline voice synthesis, prompt refinement, and pattern generation without relying on external APIs.

## 1. Candidate Models
- **Gemini Nano**: Built-in browser LLM (Chrome/Edge Canary). High efficiency, zero-latency loading.
- **WebLLM (MLC-LLM)**: Llama-3-8B or Phi-3 running via WebGPU. Cross-browser (with WebGPU support).
- **Transformers.js**: ONNX Runtime Web for local embeddings and small TTS models.

## 2. Integration Architecture
### Layer 1: Detection
- Check for `window.ai` (Gemini Nano).
- Check for WebGPU capability.

### Layer 2: UI Integration (VoiceGenTerminal)
- Add "Local Model" toggle in the Voice Model selection.
- If enabled, bypass `useAudioAI` remote calls and use a local worker.

### Layer 3: Worker Implementation
- Use a dedicated Web Worker to avoid blocking the main UI thread during model inference.
- Shared Array Buffers for streaming generated audio fragments from the worker to the Audio Engine.

## 3. Implementation Steps
1. **Feature Detection Hook**: Create `useLocalLLM` to detect availability.
2. **Gemini Nano Wrapper**: Implement a safe wrapper for `window.ai.createTextSession()`.
3. **Local Prompt Refinement**: Use the SLM to convert short user inputs into detailed producer-style prompts.
4. **Local TTS (Phase 2)**: Use Transformers.js with a small TTS model (e.g., Sherpa-ONNX) for fully offline voice generation.

## 4. Resource Management
- **Memory**: Monitor GPU/RAM usage.
- **Persistence**: Allow users to download/cache models for offline use.
