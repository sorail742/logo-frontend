"use client";

import { useEffect, useState } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { JobEvent } from "@/lib/types";

/**
 * Suit une tâche de génération (flux SSE, §11.4) puis rafraîchit les requêtes concernées.
 * Retombe sur une interrogation périodique si le flux se coupe.
 */
export function useJob(
  jobId: string | null,
  options: { invalidate: QueryKey[]; onDone?: (event: JobEvent) => void; failedMessage?: string },
) {
  const queryClient = useQueryClient();
  const [event, setEvent] = useState<JobEvent | null>(null);
  const { invalidate, onDone, failedMessage } = options;

  useEffect(() => {
    if (!jobId) return;
    let finished = false;
    const finish = (next: JobEvent) => {
      if (finished) return;
      finished = true;
      invalidate.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      if (next.status === "FAILED") toast.error(failedMessage ?? next.error ?? "La génération a échoué. Vos crédits ont été remboursés.");
      onDone?.(next);
    };
    const handle = (next: JobEvent) => {
      setEvent(next);
      if (next.status === "SUCCEEDED" || next.status === "FAILED" || next.status === "CANCELED") finish(next);
    };
    const unsubscribe = api.jobs.subscribe(jobId, handle);
    const poll = setInterval(async () => {
      try {
        const job = await api.jobs.get(jobId);
        handle({ jobId, status: job.status, progress: job.progress, error: job.error });
      } catch {
        // Nouvelle tentative au prochain intervalle
      }
    }, 3000);
    return () => {
      unsubscribe();
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const current = event?.jobId === jobId ? event : null;
  const running = Boolean(jobId) && (!current || current.status === "QUEUED" || current.status === "RUNNING");
  return { event: current, running, progress: current?.progress ?? 0 };
}

/** Attend la fin d'une tâche par interrogation (export lancé depuis un bouton). */
export async function waitForJob(jobId: string, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const job = await api.jobs.get(jobId);
    if (job.status === "SUCCEEDED" || job.status === "FAILED" || job.status === "CANCELED") return job;
    if (Date.now() > deadline) throw new Error("La tâche n'a pas abouti dans le délai prévu.");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
