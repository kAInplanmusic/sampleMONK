const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add motion import
if (!content.includes("from 'motion/react'")) {
  content = content.replace("import React,", "import { motion } from 'motion/react';\nimport React,");
}

// Replace each plugin's container with motion.div
content = content.replace(/<div className={\`(lg:col-span-11|flex flex-col gap-6|col-span-1 lg:col-span-12) (.*?)`}>/g, '<motion.div drag dragMomentum={false} whileDrag={{ zIndex: 50, scale: 1.01 }} className={`$1 $2 relative cursor-grab active:cursor-grabbing`}>');
content = content.replace(/<\/div>\s*\)\}\s*\{modules\./g, '</motion.div>\n        )}\n        {modules.');

fs.writeFileSync('src/App.tsx', content);
