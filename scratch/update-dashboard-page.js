const fs = require('fs');

const file = 'src/app/[locale]/app/page.tsx';
let lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

const studioIdx = lines.findIndex(l => l.includes('key: "studio"'));
if (studioIdx !== -1) {
  lines.splice(studioIdx + 1, 0, '    { key: "textile", href: latest ? `/app/projets/${latest.id}/textile` : "/app/projets/nouveau", icon: Shirt, tone: "bg-teal-300 text-teal-950" },');
  fs.writeFileSync(file, lines.join('\r\n'), 'utf8');
  console.log('Successfully inserted textile quick action!');
} else {
  console.log('studio line not found');
}
