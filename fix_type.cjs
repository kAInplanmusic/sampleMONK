const fs = require('fs');

let engine = fs.readFileSync('src/utils/audioEngine.ts', 'utf8');
engine = engine.replace(
  "if (b.type) this.toneShiftEqBands[i].type = b.type;",
  "if (b.type) this.toneShiftEqBands[i].type = b.type as any;"
);
fs.writeFileSync('src/utils/audioEngine.ts', engine);

let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(
  "setSamples(prev => {",
  "setSamples(prev => {\n"
);
// just to be safe
