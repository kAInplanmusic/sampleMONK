const fs = require('fs');

let content = fs.readFileSync('src/data/samples.ts', 'utf8');
content = content.replace(
  "parameters: { frequency: 7500, decay: 0.1 }\n  }\n\n  // --- ADDITIONAL 808 & 909 KIT PIECES ---",
  "parameters: { frequency: 7500, decay: 0.1 }\n  },\n\n  // --- ADDITIONAL 808 & 909 KIT PIECES ---"
);
fs.writeFileSync('src/data/samples.ts', content);
