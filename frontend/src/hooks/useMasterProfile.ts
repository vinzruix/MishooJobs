import { useEffect, useState, useMemo, useCallback } from "react";
import { liveQuery } from "dexie";
import { db } from "../db";
import type { MasterProfileData, MasterProfileRecord } from "../types/master_profile";
import { extractMasterProfileSkills } from "../services/master_profile_skills";
import { loadMasterProfile } from "../services/master_profile_service";

export interface UseMasterProfileReturn {
  profileRecord: MasterProfileRecord | null;
  profile: MasterProfileData | null;
  photoUrl: string | null;
  universalSkills: string[];
  isLoading: boolean;
  reload: () => Promise<void>;
}

export function useMasterProfile(): UseMasterProfileReturn {
  const [profileRecord, setProfileRecord] = useState<MasterProfileRecord | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Subscribe reactively to Master Profile changes
  useEffect(() => {
    let isMounted = true;

    // Ensure initial template exists if empty
    loadMasterProfile().then((rec) => {
      if (isMounted && rec) {
        setProfileRecord(rec);
        setIsLoading(false);
      }
    });

    const profileObservable = liveQuery(() => db.master_profile.get("current"));
    const profileSub = profileObservable.subscribe({
      next: (val) => {
        if (isMounted && val) {
          setProfileRecord(val);
          setIsLoading(false);
        }
      },
      error: (err) => {
        console.error("Error observando master_profile:", err);
      },
    });

    const photoObservable = liveQuery(() => db.master_profile_photo.get("current"));
    const photoSub = photoObservable.subscribe({
      next: (val) => {
        if (isMounted) {
          setPhotoBlob(val?.blob || null);
        }
      },
      error: (err) => {
        console.error("Error observando master_profile_photo:", err);
      },
    });

    return () => {
      isMounted = false;
      profileSub.unsubscribe();
      photoSub.unsubscribe();
    };
  }, []);

  // Update photo object URL safely
  useEffect(() => {
    if (!photoBlob) {
      setPhotoUrl(null);
      return;
    }

    const url = URL.createObjectURL(photoBlob);
    setPhotoUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [photoBlob]);

  const profile = profileRecord?.parsed || null;

  const universalSkills = useMemo(() => {
    return extractMasterProfileSkills(profile);
  }, [profile]);

  const reload = useCallback(async () => {
    const rec = await loadMasterProfile();
    setProfileRecord(rec);
  }, []);

  return {
    profileRecord,
    profile,
    photoUrl,
    universalSkills,
    isLoading,
    reload,
  };
}
