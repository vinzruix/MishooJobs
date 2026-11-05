import Dexie, { type EntityTable } from "dexie";
import type { CandidateProfile } from "../types/profile";
import type { ApplicationRecord, UserPreference } from "../types/application";

export class MishooJobsDatabase extends Dexie {
  candidate_profiles!: EntityTable<CandidateProfile, "id">;
  applications!: EntityTable<ApplicationRecord, "vacancy_fingerprint">;
  preferences!: EntityTable<UserPreference, "key">;

  constructor() {
    super("mishoojobs_local_db");
    this.version(1).stores({
      candidate_profiles: "id, created_at, name",
      applications: "vacancy_fingerprint, status, updated_at",
      preferences: "key",
    });
  }
}

export const db = new MishooJobsDatabase();
