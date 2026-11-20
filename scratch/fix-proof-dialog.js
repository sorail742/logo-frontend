const fs = require('fs');

const file = 'src/components/apparel/proof-dialog.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `  const { elements } = useApparelEditor();
  const design = useApparel((s) => s.design)!;
  const started = useRef(false);
  const [issues, setIssues] = useState<ApparelIssue[] | null>(null);

  // L'API renvoie des identifiants distants ou locaux : on réassocie pour la sélection.
  const localId = (remote?: string | null) => {
    if (!remote) return undefined;
    return elements.find((e) => e.id === remote)?.id ?? remote;
  };`,
  `  const { localId } = useApparelEditor();
  const design = useApparel((s) => s.design)!;
  const started = useRef(false);
  const [issues, setIssues] = useState<ApparelIssue[] | null>(null);`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed proof-dialog.tsx');

