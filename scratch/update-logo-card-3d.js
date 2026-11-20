const fs = require('fs');

const file = 'src/components/logos/logo-card.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'className={cn("glow-card grid gap-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl", logo.isFavorite && "border-primary/70 shadow-md ring-2 ring-primary/20")}',
  'className={cn("glow-card glow-card-3d glow-card-shimmer group grid gap-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-2xl", logo.isFavorite && "border-primary/70 ring-2 ring-primary/30 shadow-lg")}'
);

content = content.replace(
  '<LogoPreview spec={spec} className="aspect-[16/9] rounded-lg" />',
  '<LogoPreview spec={spec} className="aspect-[16/9] rounded-lg transition-transform duration-300 group-hover:scale-105" />'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated logo-card.tsx with 3D tilt & hover zoom!');

