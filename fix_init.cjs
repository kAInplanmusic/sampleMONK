const fs = require('fs');

let content = fs.readFileSync('src/components/MasteringOverlay.tsx', 'utf8');
content = content.replace(
  "const applyPreset = (presetKey: string) => {",
  "function applyPreset(presetKey: string) {"
);

fs.writeFileSync('src/components/MasteringOverlay.tsx', content);
