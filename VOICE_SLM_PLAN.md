# SLM Integration Plan for Voice Generator

## Goal
Integrate a Small Language Model (SLM) to enhance voice generation capabilities, specifically for more natural language processing and prompt expansion before TTS synthesis.

## Proposed Architecture
- **Client-Side Pipeline:**
    1.  User enters prompt.
    2.  Prompt is sent to SLM (e.g., via a lightweight WebWorker running a quantized model).
    3.  SLM expands/refines the prompt for the TTS model.
    4.  TTS model synthesizes audio.
- **Alternative (Server-Side):**
    -   API endpoint `/api/voice/expand-prompt` to offload inference.

## Action Items
1.  **Model Selection:** Benchmark Phi-3-mini or DistilGPT-2 for prompt refinement tasks.
2.  **Pipeline Implementation:** Update `VoiceGenTerminal` to call the SLM-expansion service.
3.  **Data/Training:** Curate a small dataset of "raw vs. high-quality" prompts to fine-tune the SLM.
4.  **Integration:** Ensure TTS models are compatible with expanded prompts.

## Success Criteria
- Improved vocal naturalness as rated by users.
- Latency under 500ms for prompt expansion.
- Fallback to original prompt if SLM inference fails.
