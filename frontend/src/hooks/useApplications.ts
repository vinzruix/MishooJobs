import { useEffect, useState, useCallback, useMemo } from "react";
import { db } from "../db";
import type { ApplicationRecord, ApplicationStatus } from "../types/application";
import type { JobVacancy } from "../types/job";

export function useApplications() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshApplications = useCallback(async () => {
    try {
      const all = await db.applications.toArray();
      setApplications(all);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshApplications();
  }, [refreshApplications]);

  const statusMap = useMemo(() => {
    const map: Record<string, ApplicationStatus> = {};
    for (const app of applications) {
      map[app.vacancy_fingerprint] = app.status;
    }
    return map;
  }, [applications]);

  const ignoredSet = useMemo(() => {
    const set = new Set<string>();
    for (const app of applications) {
      if (app.status === "ignored") {
        set.add(app.vacancy_fingerprint);
      }
    }
    return set;
  }, [applications]);

  const setApplicationStatus = useCallback(
    async (vacancy: JobVacancy, status: ApplicationStatus, notes: string = "") => {
      const now = new Date().toISOString();
      const directUrl = vacancy.external_links[0]?.direct_url || "";

      const record: ApplicationRecord = {
        vacancy_fingerprint: vacancy.fingerprint,
        title: vacancy.title,
        company_name: vacancy.company_name,
        status,
        direct_url: directUrl,
        fit_score: vacancy.heuristic_fit_score || undefined,
        notes,
        applied_at: status === "applied" ? now : null,
        updated_at: now,
      };

      await db.applications.put(record);
      await refreshApplications();
    },
    [refreshApplications]
  );

  const removeApplication = useCallback(
    async (fingerprint: string) => {
      await db.applications.delete(fingerprint);
      await refreshApplications();
    },
    [refreshApplications]
  );

  return {
    applications,
    statusMap,
    ignoredSet,
    isLoading,
    setApplicationStatus,
    removeApplication,
    refreshApplications,
  };
}
