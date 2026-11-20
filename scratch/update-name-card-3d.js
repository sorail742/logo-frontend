const fs = require('fs');

const file = 'src/components/names/name-card.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'className={cn("glow-card grid gap-3.5 rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg", isChosen && "border-primary bg-primary/[0.02] ring-2 ring-primary/30 shadow-md", name.isRejected && "opacity-60")}',
  'className={cn("glow-card glow-card-3d glow-card-shimmer group grid gap-3.5 rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-xl", isChosen && "border-primary bg-primary/[0.02] ring-2 ring-primary/30 shadow-lg", name.isRejected && "opacity-60")}'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated name-card.tsx with 3D tilt!');

