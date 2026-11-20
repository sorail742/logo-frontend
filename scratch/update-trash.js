const fs = require('fs');

const file = 'src/app/[locale]/app/corbeille/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldList = `        <ul className="divide-y rounded-xl border">
          {data?.map((project) => (
            <li key={project.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{project.chosenName?.value ?? project.title}</p>
                <p className="text-xs text-muted-foreground">
                  {t("app.trash.deletedOn", { date: format.dateTime(new Date(project.deletedAt!), { dateStyle: "medium" }) })}
                </p>
              </div>
              {can("project.delete") && (
                <Button variant="outline" onClick={() => restore.mutate(project.id)} disabled={restore.isPending}>
                  <RotateCcw />
                  {t("common.actions.restore")}
                </Button>
              )}
            </li>
          ))}
        </ul>`;

const newList = `        <div className="grid gap-3">
          {data?.map((project) => (
            <div
              key={project.id}
              className="glow-card flex items-center justify-between gap-4 rounded-2xl border bg-card p-4 shadow-2xs transition hover:border-primary/40"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <Trash2 className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{project.chosenName?.value ?? project.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("app.trash.deletedOn", {
                      date: format.dateTime(new Date(project.deletedAt!), { dateStyle: "medium" }),
                    })}
                  </p>
                </div>
              </div>
              {can("project.delete") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => restore.mutate(project.id)}
                  disabled={restore.isPending}
                  className="shrink-0 gap-1.5"
                >
                  <RotateCcw className="size-4" />
                  {t("common.actions.restore")}
                </Button>
              )}
            </div>
          ))}
        </div>`;

const normContent = content.replace(/\r\n/g, '\n');
const normOld = oldList.replace(/\r\n/g, '\n');
const normNew = newList.replace(/\r\n/g, '\n');

if (normContent.includes(normOld)) {
  fs.writeFileSync(file, normContent.replace(normOld, normNew).replace(/\n/g, '\r\n'), 'utf8');
  console.log('Updated corbeille/page.tsx with glow-cards');
} else {
  console.log('Old list not matched in corbeille/page.tsx');
}

