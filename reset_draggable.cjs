const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<\/DraggableWindow>/g, '</div>');
content = content.replace(/<DraggableWindow/g, '<div');

fs.writeFileSync('src/App.tsx', content);
