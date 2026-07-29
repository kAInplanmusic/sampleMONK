# MASTER_TODO.md

## Technical Roadmap: Phase 4 & Beyond

### 1. Performance & DSP Optimization
- [ ] Migrate `src/audio/worklets/dspProcessor.ts` to Rust/WASM.
- [ ] Migrate `src/audio/worklets/stemExtractor.ts` to Rust/WASM.
- [ ] Audit and optimize `AudioWorklet` buffer sizes for sub-10ms latency.

### 2. Infrastructure & Scalability
- [ ] Develop Terraform scripts for GCP infrastructure (GCE, VPC, Cloud Run).
- [ ] Implement Redis adapter for `socket.io` to enable horizontal scaling of signaling.
- [ ] Configure GKE for robust service orchestration.

### 3. CI/CD & Testing Automation
- [ ] Set up Playwright for E2E UI testing.
- [ ] Set up Vitest for DSP unit testing.
- [ ] Configure Google Cloud Build triggers for automated deployment pipelines.

### 4. Advanced AI Integration
- [ ] Audit latency between `services/library-ai` / `services/stem-ai` and Vertex AI.
- [ ] Implement request batching and caching for AI inference.
- [ ] Integrate Vertex AI streaming responses for real-time vocal feedback.

### 5. Monitoring & Observability
- [ ] Implement OpenTelemetry for cross-service tracing (frontend to backend to AI).
- [ ] Configure Cloud Monitoring dashboards for audio latency and signal drop-out tracking.
- [ ] Set up automated alerts for high error rates in signaling/TURN infrastructure.
