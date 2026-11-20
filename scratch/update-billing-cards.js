const fs = require('fs');

const file = 'src/app/[locale]/app/facturation/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<Card>/g, '<Card className="glow-card border-border/80 bg-card shadow-xs">');

fs.writeFileSync(file, content, 'utf8');
console.log('Updated facturation/page.tsx with glow-card');

