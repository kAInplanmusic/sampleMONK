const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// I'll replace `</div>\n        )}\n        {modules.` with `</DraggableWindow>\n        )}\n        {modules.`
content = content.replace(/<\/div>\s*\)\}\s*\{modules\./g, '</DraggableWindow>\n        )}\n        {modules.');

content = content.replace(/<\/div>\s*\)\}\s*\{\/\* GENERIC PLUGIN TERMINALS \*\/\}/g, '</DraggableWindow>\n        )}\n        {/* GENERIC PLUGIN TERMINALS */}');

content = content.replace(/<\/div>\s*\);\s*\}\)\}/g, '</DraggableWindow>\n          );\n        })}');

// Master out / final plugin closing
content = content.replace(/<\/div>\s*\)\}\s*<\/main>/, '</DraggableWindow>\n        )}\n      </main>');

fs.writeFileSync('src/App.tsx', content);
