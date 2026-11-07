import { useCallback, useRef, useState } from "react";
import type { DeduplicationSummary, JobVacancy, PortalName, PortalStatus, StreamEndEvent } from "../types/job";
import { startJobStream, type StreamFilterParams } from "../services/sse";

export function useJobStream() {
  const [isSearching, setIsSearching] = useState(false);
  const [portalStatuses, setPortalStatuses] = useState<Record<PortalName, PortalStatus>>({
    computrabajo: { portal: "computrabajo", status: "searching", count: 0 },
    indeed: { portal: "indeed", status: "searching", count: 0 },
    occ: { portal: "occ", status: "searching", count: 0 },
  });
  const [vacancies, setVacancies] = useState<JobVacancy[]>([]);
  const [summary, setSummary] = useState<DeduplicationSummary | null>(null);
  const [streamEnd, setStreamEnd] = useState<StreamEndEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<(() => void) | null>(null);

  const search = useCallback((params: StreamFilterParams) => {
    // Cancel any ongoing stream
    if (abortRef.current) {
      abortRef.current();
    }

    setIsSearching(true);
    setVacancies([]);
    setSummary(null);
    setStreamEnd(null);
    setError(null);

    // Initial default statuses
    setPortalStatuses({
      computrabajo: { portal: "computrabajo", status: "searching", count: 0, message: "Computrabajo: Consultando..." },
      indeed: { portal: "indeed", status: "searching", count: 0, message: "Indeed México: Consultando..." },
      occ: { portal: "occ", status: "searching", count: 0, message: "OCC Mundial: Consultando..." },
    });

    const stopStream = startJobStream(
      params,
      {
        onPortalStatus: (status) => {
          setPortalStatuses((prev) => ({
            ...prev,
            [status.portal]: status,
          }));
        },
        onVacancyBatch: (batch) => {
          setVacancies((prev) => {
            const normalizedBatch = batch.map((v) => ({
              ...v,
              description: v.description || (v as any).description_clean || "",
              skills: Array.isArray(v.skills) ? v.skills : (Array.isArray((v as any).skills_extracted) ? (v as any).skills_extracted : []),
            }));
            // Deduplicate by fingerprint in state
            const existingFp = new Set(prev.map((v) => v.fingerprint));
            const newOnes = normalizedBatch.filter((v) => !existingFp.has(v.fingerprint));
            return [...prev, ...newOnes];
          });
        },
        onDeduplicationSummary: (s) => {
          setSummary(s);
        },
        onStreamEnd: (end) => {
          setIsSearching(false);
          setStreamEnd(end);
        },
        onError: (err) => {
          setIsSearching(false);
          setError(err.message);
        },
      }
    );

    abortRef.current = stopStream;
  }, []);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      setIsSearching(false);
    }
  }, []);

  return {
    isSearching,
    portalStatuses,
    vacancies,
    summary,
    streamEnd,
    error,
    search,
    cancel,
  };
}
