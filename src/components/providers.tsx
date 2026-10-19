"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { api, ApiError } from "@/lib/api";
import { useSessionStore } from "@/stores/session";

function SessionBootstrap() {
  const setUser = useSessionStore((s) => s.setUser);
  useEffect(() => {
    // Au chargement, le cookie de rafraîchissement redonne un jeton d'accès s'il est valide.
    api.auth
      .refresh()
      .then((session) => setUser(session?.user ?? null))
      .catch(() => setUser(null));
  }, [setUser]);
  return null;
}

function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionBootstrap />
      <ServiceWorker />
      {children}
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
