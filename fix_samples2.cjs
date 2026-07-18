const fs = require('fs');

let content = fs.readFileSync('src/data/samples.ts', 'utf8');
content = content.replace(
  "decay: 0.1 }\n  }\n\n  // --- ADDITIONAL",
  "decay: 0.1 }\n  },\n\n  // --- ADDITIONAL"
);

// wait let's check what the last item was before "];"
