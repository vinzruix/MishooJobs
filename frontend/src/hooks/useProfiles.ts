import { useEffect, useState, useCallback } from "react";
import { db } from "../db";
import type { CandidateProfile } from "../types/profile";

export function useProfiles() {
  const [profiles, setProfiles] = useState<CandidateProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load profiles and active selection from Dexie
  const refreshProfiles = useCallback(async () => {
    try {
      const all = await db.candidate_profiles.toArray();
      setProfiles(all);

      const pref = await db.preferences.get("active_profile_id");
      if (pref && all.some((p) => p.id === pref.value)) {
        setActiveProfileId(pref.value);
      } else if (all.length > 0) {
        setActiveProfileId(all[0].id);
      } else {
        setActiveProfileId(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  const selectActiveProfile = useCallback(async (id: string) => {
    setActiveProfileId(id);
    await db.preferences.put({ key: "active_profile_id", value: id });
  }, []);

  const addProfile = useCallback(async (profile: CandidateProfile) => {
    await db.candidate_profiles.put(profile);
    await selectActiveProfile(profile.id);
    await refreshProfiles();
  }, [refreshProfiles, selectActiveProfile]);

  const removeProfile = useCallback(async (id: string) => {
    await db.candidate_profiles.delete(id);
    if (activeProfileId === id) {
      await db.preferences.delete("active_profile_id");
    }
    await refreshProfiles();
  }, [activeProfileId, refreshProfiles]);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  return {
    profiles,
    activeProfile,
    activeProfileId,
    isLoading,
    selectActiveProfile,
    addProfile,
    removeProfile,
    refreshProfiles,
  };
}
