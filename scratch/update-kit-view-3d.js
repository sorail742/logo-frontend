const fs = require('fs');

const file = 'src/components/kit/kit-view.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'className="glow-card border-border/80 shadow-xs hover:border-primary/40"',
  'className="glow-card glow-card-3d glow-card-shimmer border-border/80 shadow-xs hover:border-primary/50 hover:shadow-xl"'
);

content = content.replace(
  'className="bg-checker aspect-[16/9] rounded-xl p-6"',
  'className="studio-stage aspect-[16/9] rounded-xl p-6 border border-border/60 shadow-inner transition-transform duration-300 hover:scale-[1.02]"'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated kit-view.tsx with studio stage and 3D card tilt!');

