// === AudioWorkletGlobalScope-Konstanten (im Worker-Kontext global verfügbar) ===
declare const sampleRate: number;
declare const currentFrame: number;
declare const currentTime: number;
declare const AudioWorkletGlobalScope: typeof globalThis & {
  sampleRate: number;
  currentFrame: number;
  currentTime: number;
  registerProcessor: typeof registerProcessor;
  readonly port: MessagePort;
};

declare abstract class AudioWorkletProcessor {
  readonly port: MessagePort;
  abstract process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

declare function registerProcessor(
  name: string,
  processorCtor: new (...args: any[]) => AudioWorkletProcessor
): void;

interface HIDDevice {
  readonly vendorId?: number;
  readonly productId?: number;
  readonly productName?: string;
}

interface HIDDeviceFilter {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}

interface HID {
  getDevices(): Promise<HIDDevice[]>;
  requestDevice(options: { filters: HIDDeviceFilter[] }): Promise<HIDDevice[]>;
}

interface GPUDevice {}

interface GPUAdapter {
  requestDevice(): Promise<GPUDevice>;
}

interface GPU {
  requestAdapter(): Promise<GPUAdapter | null>;
}

interface Navigator {
  hid?: HID;
  gpu?: GPU;
}
