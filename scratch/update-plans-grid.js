const fs = require('fs');

const file = 'src/components/billing/plans-grid.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'className={cn("relative flex flex-col rounded-2xl border bg-card p-5 shadow-xs transition hover:shadow-md"',
  'className={cn("glow-card relative flex flex-col rounded-2xl border bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated plans-grid.tsx');

