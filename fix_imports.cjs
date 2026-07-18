const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  "CloudLightning",
  "CloudLightning, Terminal, Grid3X3, Maximize2, Minimize2"
);
fs.writeFileSync('src/App.tsx', content);
