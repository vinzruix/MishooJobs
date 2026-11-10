import { useEffect, useState, useCallback } from "react";
import { liveQuery } from "dexie";
import { db } from "../db";
import type { GeneratedResumeRecord } from "../types/resume";

export interface UseResumesReturn {
  resumes: GeneratedResumeRecord[];
  isLoading: boolean;
  deleteResume: (id: string) => Promise<void>;
  duplicateResume: (id: string) => Promise<GeneratedResumeRecord | null>;
  getResume: (id: string) => Promise<GeneratedResumeRecord | undefined>;
}

export function useResumes(): UseResumesReturn {
  const [resumes, setResumes] = useState<GeneratedResumeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const observable = liveQuery(async () => {
      const all = await db.resumes.toArray();
      // Sort newest first
      return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });

    const sub = observable.subscribe({
      next: (list) => {
        if (isMounted) {
          setResumes(list);
          setIsLoading(false);
        }
      },
      error: (err) => {
        console.error("Error observando colección de resumes:", err);
        if (isMounted) setIsLoading(false);
      },
    });

    return () => {
      isMounted = false;
      sub.unsubscribe();
    };
  }, []);

  const deleteResume = useCallback(async (id: string) => {
    await db.resumes.delete(id);
  }, []);

  const duplicateResume = useCallback(async (id: string) => {
    const original = await db.resumes.get(id);
    if (!original) return null;

    const copyRecord: GeneratedResumeRecord = {
      ...original,
      id: crypto.randomUUID(),
      title: `${original.title} (Copia)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.resumes.put(copyRecord);
    return copyRecord;
  }, []);

  const getResume = useCallback(async (id: string) => {
    return db.resumes.get(id);
  }, []);

  return {
    resumes,
    isLoading,
    deleteResume,
    duplicateResume,
    getResume,
  };
}
