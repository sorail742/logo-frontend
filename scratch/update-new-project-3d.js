const fs = require('fs');

const file = 'src/app/[locale]/app/projets/nouveau/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '"glow-card group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4.5 transition-all duration-200"',
  '"glow-card glow-card-3d glow-card-shimmer group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4.5 transition-all duration-300 hover:-translate-y-1.5"'
);

content = content.replace(
  '"glow-card group relative flex cursor-pointer gap-3.5 rounded-2xl border p-4.5 transition-all duration-200"',
  '"glow-card glow-card-3d glow-card-shimmer group relative flex cursor-pointer gap-3.5 rounded-2xl border p-4.5 transition-all duration-300 hover:-translate-y-1.5"'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated nouveau/page.tsx with 3D cards and specular shimmer!');

