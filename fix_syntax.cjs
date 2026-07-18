const fs = require('fs');

function unescapeBackticks(file) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/\\\`/g, "`");
        content = content.replace(/\\\${/g, "${");
        fs.writeFileSync(file, content);
    }
}

unescapeBackticks('src/components/StemExtractorTerminal.tsx');
unescapeBackticks('src/components/VoiceGenTerminal.tsx');
