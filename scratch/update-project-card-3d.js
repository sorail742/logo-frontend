const fs = require('fs');

const file = 'src/components/projects/project-card.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'className="glow-card group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"',
  'className="glow-card glow-card-3d glow-card-shimmer group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-2xl"'
);

const oldPreview = `        {project.previewSpec ? (
          <LogoPreview spec={project.previewSpec} className="h-full w-full bg-transparent p-7" />
        ) : (`;

const newPreview = `        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/35 opacity-70" aria-hidden="true" />
        {project.previewSpec ? (
          <LogoPreview spec={project.previewSpec} className="h-full w-full bg-transparent p-7 transition-transform duration-300 group-hover:scale-105" />
        ) : (`;

const normContent = content.replace(/\r\n/g, '\n');
const normOld = oldPreview.replace(/\r\n/g, '\n');
const normNew = newPreview.replace(/\r\n/g, '\n');

if (normContent.includes(normOld)) {
  fs.writeFileSync(file, normContent.replace(normOld, normNew).replace(/\n/g, '\r\n'), 'utf8');
  console.log('Successfully updated project-card.tsx with 3D tilt, shimmer & hover zoom!');
} else {
  console.log('oldPreview not matched in project-card.tsx');
}

