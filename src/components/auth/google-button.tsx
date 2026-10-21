"use client";

import { useEffect, useRef } from "react";

// Bouton « Se connecter avec Google » de Google Identity Services : renvoie un ID token,
// vérifié par l'API (POST /auth/google, §13.2).

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

interface GoogleIdentity {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        ux_mode?: "popup";
      }): void;
      renderButton(element: HTMLElement, options: Record<string, string | number>): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let loading: Promise<GoogleIdentity> | null = null;

function loadScript() {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.google ? resolve(window.google) : reject(new Error("Google Identity Services indisponible"));
    script.onerror = () => {
      loading = null;
      reject(new Error("Google Identity Services indisponible"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export function GoogleButton({
  onCredential,
  locale,
}: {
  onCredential: (idToken: string) => void;
  locale: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  useEffect(() => {
    callback.current = onCredential;
  });

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    let cancelled = false;
    loadScript()
      .then((google) => {
        if (cancelled || !container.current) return;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => callback.current(response.credential),
          ux_mode: "popup",
        });
        google.accounts.id.renderButton(container.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: container.current.clientWidth || 320,
          locale,
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return <div ref={container} className="flex min-h-10 justify-center" />;
}
