const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The original replacement was:
// content = content.replace(/<\/div>\s*\)\}\s*\{modules\./g, '</motion.div>\n        )}\n        {modules.');
// This only replaces the div that immediately precedes another {modules.

// Let's replace the mismatched closing divs by finding the corresponding motion.divs.
// Actually, it's safer to just replace all `</div>` that are right before `)}` if they belong to a motion.div
// But we can just fix the specific lines.
content = content.replace(/<\/div>\s*\)\}\s*\{modules\.sequencer/g, '</motion.div>\n        )}\n        {modules.sequencer');
content = content.replace(/<\/div>\s*\)\}\s*\{modules\.sample_db/g, '</motion.div>\n        )}\n        {modules.sample_db');
content = content.replace(/<\/div>\s*\)\}\s*\{\/\* GENERIC PLUGIN TERMINALS \*\/\}/g, '</motion.div>\n        )}\n        {/* GENERIC PLUGIN TERMINALS */}');

// The generic map also has a motion.div now, but the loop returns it, so it ends with </div>);
content = content.replace(/<\/div>\s*\);\s*\}\)\}/g, '</motion.div>\n          );\n        })}');


fs.writeFileSync('src/App.tsx', content);
