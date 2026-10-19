import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Exclut les fichiers statiques, les routes internes de Next.js et le service worker.
  matcher: "/((?!api|_next|_vercel|sw\\.js|.*\\..*).*)",
};
