const fs = require('fs');

let overlayContent = fs.readFileSync('src/components/MasteringOverlay.tsx', 'utf8');
overlayContent = overlayContent.replace(
  "audioEngine.updateToneShiftEQ(preset.tone_shift);",
  "audioEngine.updateToneShiftEQ(preset.tone_shift as any);"
);
overlayContent = overlayContent.replace(
  "audioEngine.updateToneShiftEQ({ bands: next.bands });",
  "audioEngine.updateToneShiftEQ({ bands: next.bands as any });"
);
fs.writeFileSync('src/components/MasteringOverlay.tsx', overlayContent);

let engineContent = fs.readFileSync('src/utils/audioEngine.ts', 'utf8');
engineContent = engineContent.replace(
  "this.limiter?.dispose();", 
  "this.masterMeLimiter?.dispose();\n    this.masterMeMultiband?.dispose();\n    this.masterMeCompressor?.dispose();\n    this.masterMeHighpass?.dispose();\n    this.masterMePreGain?.dispose();\n    this.toneShiftTilt?.dispose();\n    this.toneShiftEqBands.forEach(b => b.dispose());"
);
fs.writeFileSync('src/utils/audioEngine.ts', engineContent);
console.log('Fixed TS');
