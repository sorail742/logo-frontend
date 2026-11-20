const fs = require('fs');

const file = 'src/components/projects/project-card.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Shirt to imports
content = content.replace(
  'import { Copy, MoreHorizontal, Sparkles, Trash2 } from "lucide-react";',
  'import { Copy, MoreHorizontal, Shirt, Sparkles, Trash2 } from "lucide-react";'
);

// 2. Replace the single studio Link with the group
const oldHover = `        <Link
          href={\`/app/projets/\${project.id}/studio\`}
          className="absolute right-3 bottom-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-800 opacity-0 shadow-sm ring-1 ring-black/5 transition group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Sparkles className="size-3" aria-hidden="true" />
          {t("app.dashboard.openStudio")}
        </Link>`;

const newHover = `        <div className="absolute right-3 bottom-3 z-10 flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <Link
            href={\`/app/projets/\${project.id}/textile\`}
            className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-emerald-800 shadow-sm ring-1 ring-emerald-500/20 backdrop-blur hover:bg-white hover:text-emerald-950"
          >
            <Shirt className="size-3 text-emerald-600" aria-hidden="true" />
            Textile
          </Link>
          <Link
            href={\`/app/projets/\${project.id}/studio\`}
            className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-800 shadow-sm ring-1 ring-black/5 backdrop-blur hover:bg-white"
          >
            <Sparkles className="size-3 text-amber-500" aria-hidden="true" />
            {t("app.dashboard.openStudio")}
          </Link>
        </div>`;

// Replace normalizing newlines
const normContent = content.replace(/\r\n/g, '\n');
const normOld = oldHover.replace(/\r\n/g, '\n');
const normNew = newHover.replace(/\r\n/g, '\n');

if (normContent.includes(normOld)) {
  const updated = normContent.replace(normOld, normNew);
  fs.writeFileSync(file, updated.replace(/\n/g, '\r\n'), 'utf8');
  console.log('Successfully updated project-card.tsx');
} else {
  console.log('Could not find oldHover in project-card.tsx');
}

