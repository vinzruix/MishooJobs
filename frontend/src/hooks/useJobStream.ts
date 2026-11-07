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
            const map = new Map<string, JobVacancy>();
            for (const v of prev) {
              map.set(v.fingerprint, v);
            }

            for (const raw of batch) {
              const v: JobVacancy = {
                ...raw,
                description: raw.description || (raw as any).description_clean || "",
                skills: Array.isArray(raw.skills)
                  ? raw.skills
                  : Array.isArray((raw as any).skills_extracted)
                  ? (raw as any).skills_extracted
                  : [],
              };

              const existing = map.get(v.fingerprint);
              if (existing) {
                // Merge external links (1 primary link per portal to prevent duplicate portal buttons)
                const existingPortals = new Set(existing.external_links.map((l) => (l.portal_name || "").toLowerCase()));
                const mergedLinks = [...existing.external_links];
                for (const l of v.external_links || []) {
                  const pName = (l.portal_name || "").toLowerCase();
                  if (!existingPortals.has(pName)) {
                    mergedLinks.push(l);
                    existingPortals.add(pName);
                  }
                }
                existing.external_links = mergedLinks;

                // Keep longer description
                if ((v.description?.length || 0) > (existing.description?.length || 0)) {
                  existing.description = v.description;
                }

                // Keep most recent publication date
                if (!existing.published_at && v.published_at) {
                  existing.published_at = v.published_at;
                } else if (existing.published_at && v.published_at) {
                  const existingTime = new Date(existing.published_at).getTime();
                  const newTime = new Date(v.published_at).getTime();
                  if (!isNaN(newTime) && (isNaN(existingTime) || newTime > existingTime)) {
                    existing.published_at = v.published_at;
                  }
                }

                // Merge skills
                const skillSet = new Set(existing.skills);
                for (const s of v.skills || []) {
                  skillSet.add(s);
                }
                existing.skills = Array.from(skillSet);
              } else {
                map.set(v.fingerprint, v);
              }
            }

            return Array.from(map.values());
          });
        },
        onDeduplicationSummary: (s, canonicalVacs) => {
          setSummary(s);
          if (canonicalVacs && canonicalVacs.length > 0) {
            setVacancies(
              canonicalVacs.map((v) => ({
                ...v,
                description: v.description || (v as any).description_clean || "",
                skills: Array.isArray(v.skills)
                  ? v.skills
                  : Array.isArray((v as any).skills_extracted)
                  ? (v as any).skills_extracted
                  : [],
              }))
            );
          }
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
