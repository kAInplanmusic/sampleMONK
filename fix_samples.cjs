const fs = require('fs');
let content = fs.readFileSync('src/data/samples.ts', 'utf8');
content = content.replace(
  "decay: 0.2 }\n  }\n\n  // --- NEW CLASSIC",
  "decay: 0.2 }\n  },\n\n  // --- NEW CLASSIC"
);
// let's just do a regex replace to be safe
content = content.replace(/decay: 0\.2 \}\n\s+\}\n\n\s+\/\/ --- NEW CLASSIC/g, "decay: 0.2 }\n  },\n\n  // --- NEW CLASSIC");
// actually wait, let's look at the exact text from grep:
// 101-    parameters: { frequency: 4500, decay: 0.2 }
// 102-  }
// 103-
// 104:  // --- NEW CLASSIC & MODERN MACHINES ---

content = content.replace(
  "parameters: { frequency: 4500, decay: 0.2 }\n  }\n\n  // --- NEW CLASSIC & MODERN MACHINES ---",
  "parameters: { frequency: 4500, decay: 0.2 }\n  },\n\n  // --- NEW CLASSIC & MODERN MACHINES ---"
);

fs.writeFileSync('src/data/samples.ts', content);
