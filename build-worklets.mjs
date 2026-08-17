import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import { readdir, mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKLETS_DIR = path.resolve(__dirname, 'src/audio/worklets');
// Pfad-Konsistenz: Vite kopiert `public/` in das Stage-Root und serviert
// `dist/` als statisches Root (server.ts). Damit `/worklets/<name>.js` auf die
// gebaute Datei zeigt, schreiben wir direkt nach `dist/worklets`.
const OUTPUT_DIR = path.resolve(__dirname, 'dist/worklets');

async function buildWorklets() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const files = await readdir(WORKLETS_DIR);

  for (const file of files) {
    if (file.endsWith('.ts')) {
      const inputPath = path.join(WORKLETS_DIR, file);
      const outputPath = path.join(OUTPUT_DIR, file.replace('.ts', '.js'));

      console.log(`Building ${inputPath} to ${outputPath}`);
      await esbuild.build({
        entryPoints: [inputPath],
        bundle: true,
        outfile: outputPath,
        format: 'esm', // Web Worklets are typically ES Modules
        platform: 'browser',
        sourcemap: false,
        minify: true,
      });
    }
  }
  console.log('Worklets built successfully!');
}

buildWorklets().catch((error) => {
  console.error('Error building worklets:', error);
  process.exit(1);
});
