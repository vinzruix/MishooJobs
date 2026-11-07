import type { DeduplicationSummary, JobVacancy, PortalStatus, StreamEndEvent } from "../types/job";

export interface StreamCallbacks {
  onPortalStatus?: (status: PortalStatus) => void;
  onVacancyBatch?: (vacancies: JobVacancy[]) => void;
  onDeduplicationSummary?: (summary: DeduplicationSummary, vacancies?: JobVacancy[]) => void;
  onStreamEnd?: (end: StreamEndEvent) => void;
  onError?: (err: Error) => void;
}

export interface StreamFilterParams {
  query: string;
  location?: string;
  modality?: string;
  category?: string;
  limit_per_portal?: number;
}

export function startJobStream(
  params: StreamFilterParams,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): () => void {
  const abortController = new AbortController();
  const linkedSignal = signal || abortController.signal;

  const searchParams = new URLSearchParams({
    query: params.query,
    location: params.location || "México",
    modality: params.modality || "all",
    category: params.category || "all",
    limit_per_portal: String(params.limit_per_portal || 15),
  });

  const url = `/api/v1/jobs/stream?${searchParams.toString()}`;

  fetch(url, { signal: linkedSignal })
    .then(async (response) => {
      if (!response.ok || !response.body) {
        throw new Error(`Error en el servidor: HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const rawEvent of events) {
          if (!rawEvent.trim()) continue;

          let eventName = "message";
          let dataStr = "";

          const lines = rawEvent.split("\n");
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataStr = line.slice(5).trim();
            }
          }

          if (!dataStr) continue;

          try {
            const parsedData = JSON.parse(dataStr);
            if (eventName === "portal_status" && callbacks.onPortalStatus) {
              callbacks.onPortalStatus(parsedData);
            } else if (eventName === "vacancy_batch" && callbacks.onVacancyBatch) {
              callbacks.onVacancyBatch(parsedData.vacancies || []);
            } else if (eventName === "deduplication_summary" && callbacks.onDeduplicationSummary) {
              callbacks.onDeduplicationSummary(parsedData, parsedData.vacancies);
            } else if (eventName === "stream_end" && callbacks.onStreamEnd) {
              callbacks.onStreamEnd(parsedData);
            }
          } catch (e) {
            console.error("Error al parsear evento SSE:", e, dataStr);
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    });

  return () => {
    abortController.abort();
  };
}
