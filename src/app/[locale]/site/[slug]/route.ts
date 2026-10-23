// Site web publié d'une marque : la page rendue par l'API, servie sous l'adresse de la plateforme
// (/site/<adresse>). Styles et script sont intégrés à la page ; polices et images restent sur l'API.

const API_URL = (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1").replace(/\/$/, "");
const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/;

const NOT_FOUND = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Site introuvable</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;color:#1f2937;background:#f8fafc;text-align:center;padding:24px}h1{font-size:1.4rem;margin:0 0 .5rem}p{color:#64748b;margin:0}</style></head><body><main><h1>Ce site n'est pas (ou plus) en ligne</h1><p>Vérifiez l'adresse, ou revenez un peu plus tard.</p></main></body></html>`;

function html(body: string, status: number, cache: string) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": cache,
    },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  if (!SLUG.test(slug)) return html(NOT_FOUND, 404, "no-store");
  try {
    const response = await fetch(`${API_URL}/public/sites/${slug}`, { cache: "no-store", headers: { Accept: "text/html" } });
    if (!response.ok) return html(NOT_FOUND, 404, "no-store");
    return html(await response.text(), 200, "public, max-age=60, stale-while-revalidate=300");
  } catch {
    return html(NOT_FOUND, 503, "no-store");
  }
}
