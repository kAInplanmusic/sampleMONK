// src/audio/wasm/WasmPluginHost.ts

export interface WasmPluginInstance {
  process: (input: Float32Array, output: Float32Array) => void;
  setParameter: (name: string, value: number) => void;
}

export class WasmPluginHost {
  private instance: WasmPluginInstance | null = null;

  async loadPlugin(wasmUrl: string): Promise<void> {
    const response = await fetch(wasmUrl);
    const buffer = await response.arrayBuffer();
    // Emscripten/WASM instantiation
    const module = await WebAssembly.instantiate(buffer, {
        env: { memory: new WebAssembly.Memory({ initial: 256 }) }
    });
    this.instance = module.instance.exports as unknown as WasmPluginInstance;
  }

  processAudio(input: Float32Array, output: Float32Array) {
    if (this.instance) {
      this.instance.process(input, output);
    }
  }
}
