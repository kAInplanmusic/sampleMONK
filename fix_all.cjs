const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<\/motion\.div>\s*\);\s*\}\)\}/g, '</div>\n          );\n        })}');
content = content.replace(/<\/motion\.div>\s*\);\s*\}\)\}/g, '</div>\n          );\n        })}');

// Fix lines reported:
// 712:22 ERROR: Unexpected closing "motion.div" tag does not match opening "div" tag
content = content.replace(/<User className="w-5 h-5" \/>\s*<\/motion.div>/, '<User className="w-5 h-5" />\n                    </div>');

// 1288:10 ERROR: Unexpected closing "div" tag does not match opening "motion.div" tag
// 1354:10 ERROR: Unexpected closing "div" tag does not match opening "motion.div" tag
// 1593:26 ERROR: Unexpected closing "motion.div" tag does not match opening "div" tag
// 1769:12 ERROR: Unexpected closing "div" tag does not match opening "motion.div" tag

// Revert all motion.div replacements for the plugins, and I'll do it safely.
content = content.replace(/<motion\.div drag dragMomentum={false} whileDrag={{ zIndex: 50, scale: 1.01 }} className={`(.*?) relative cursor-grab active:cursor-grabbing`}>/g, '<div className={`$1`}>');
content = content.replace(/<\/motion\.div>/g, '</div>');

fs.writeFileSync('src/App.tsx', content);
