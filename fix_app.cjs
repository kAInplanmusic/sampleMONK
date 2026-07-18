const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The error shows things like:
// 713:22 ERROR: Unexpected closing "DraggableWindow" tag does not match opening "div" tag
content = content.replace(/<User className="w-5 h-5" \/>\s*<\/DraggableWindow>/g, '<User className="w-5 h-5" />\n                    </div>');

// Error on 1594:
// 1592|                              </div>
// 1593|                            </div>
// 1594|                          </DraggableWindow>
content = content.replace(/<\/div>\s*<\/div>\s*<\/DraggableWindow>\s*\);/g, '</div>\n                            </div>\n                          </div>\n            );');

// The rest are missing `<DraggableWindow>` open tags!
// Because `patch_draggable2.cjs` matched `<div className=\{`lg:col-span-11...`\}>` and `patch_all.cjs` matched `<div className={`(.*?)`}>` and reverted them!
// Wait, I reverted the `<motion.div>` to `<div className...>` in `fix_all.cjs`, but THEN I ran `patch_draggable_close.cjs` which replaced `</div>` with `</DraggableWindow>`!!
// That means the opening tags are `<div ...>` and the closing tags are `</DraggableWindow>`.

// Let's replace ALL `</DraggableWindow>` with `</div>` to reset everything back to `<div>...</div>`.
content = content.replace(/<\/DraggableWindow>/g, '</div>');

// Now, let's properly run the DraggableWindow patch again!
// We will replace `<div className={` (for plugins) with `<DraggableWindow className={`
const blocks = [
  "modules.ai_terminal === 'active'",
  "modules.sequencer === 'active'",
  "modules.sample_db === 'active'",
  "modules.mischpult === 'active'",
  "modules.drum_machines === 'active'",
  "modules.instruments === 'active'",
  "modules.stem_extractor === 'active'",
  "modules.voice_gen === 'active'",
  "modules.spatial === 'active'",
  "modules.eq === 'active'",
  "modules.midi === 'active'",
  "modules.recorder === 'active'",
  "modules.dsp === 'active'",
  "modules.custom_slot === 'active'",
  "modules.dj_fx === 'active'",
  "modules.mastering === 'active'"
];

blocks.forEach(block => {
  const regexStr = "\\{" + block.replace(/\./g, '\\.').replace(/\=/g, '\\=').replace(/\'/g, "\\'") + "\\s*===\\s*'active'\\s*&&\\s*\\(\\s*<div className=\\{`([^`]+)`\\}>";
  const regex = new RegExp(regexStr, "g");
  
  content = content.replace(regex, (match, classes) => {
    return `{${block} && (\n          <DraggableWindow className={\`${classes}\`}>`;
  });
});

// Also the generic plugin map
const genericMapRegex = /\{PLUGIN_REGISTRY\.filter\([^)]*\)\.map\(plugin => \{[\s\S]*?return \(\s*<div key=\{plugin\.id\} className="col-span-1 lg:col-span-12">/;
content = content.replace(genericMapRegex, (match) => {
  return match.replace('<div key={plugin.id} className="col-span-1 lg:col-span-12">', '<DraggableWindow key={plugin.id} className="col-span-1 lg:col-span-12">');
});

// AND NOW we replace the closing `</div>` correctly!
// For all specific modules, the `</div>\n        )}\n        {modules.` can be replaced by `</DraggableWindow>\n        )}\n        {modules.`
content = content.replace(/<\/div>\s*\)\}\s*\{modules\./g, '</DraggableWindow>\n        )}\n        {modules.');
content = content.replace(/<\/div>\s*\)\}\s*\{\/\* GENERIC PLUGIN TERMINALS \*\/\}/g, '</DraggableWindow>\n        )}\n        {/* GENERIC PLUGIN TERMINALS */}');
content = content.replace(/<\/div>\s*\);\s*\}\)\}/g, '</DraggableWindow>\n          );\n        })}');
content = content.replace(/<\/div>\s*\)\}\s*<\/main>/, '</DraggableWindow>\n        )}\n      </main>');


fs.writeFileSync('src/App.tsx', content);
