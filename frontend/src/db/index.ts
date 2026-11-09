import Dexie, { type EntityTable } from "dexie";
import type { CandidateProfile } from "../types/profile";
import type { ApplicationRecord, UserPreference } from "../types/application";
import type { MasterProfileRecord, MasterProfilePhotoRecord } from "../types/master_profile";
import type { GeneratedResumeRecord } from "../types/resume";

export class MishooJobsDatabase extends Dexie {
  candidate_profiles!: EntityTable<CandidateProfile, "id">;
  applications!: EntityTable<ApplicationRecord, "vacancy_fingerprint">;
  preferences!: EntityTable<UserPreference, "key">;

  master_profile!: EntityTable<MasterProfileRecord, "id">;
  master_profile_photo!: EntityTable<MasterProfilePhotoRecord, "id">;
  resumes!: EntityTable<GeneratedResumeRecord, "id">;

  constructor() {
    super("mishoojobs_local_db");
    this.version(1).stores({
      candidate_profiles: "id, created_at, name",
      applications: "vacancy_fingerprint, status, updated_at",
      preferences: "key",
    });

    this.version(2).stores({
      candidate_profiles: "id, created_at, name",
      applications: "vacancy_fingerprint, status, updated_at",
      preferences: "key",
      master_profile: "id, updated_at",
      master_profile_photo: "id",
      resumes: "id, type, target_role, vacancy_fingerprint, created_at, updated_at",
    });
  }
}

export const db = new MishooJobsDatabase();
