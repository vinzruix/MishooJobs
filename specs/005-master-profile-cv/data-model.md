# Data Model Specification: Master Career Knowledge Base & Dynamic AI CV Generator

**Feature Branch**: `005-master-profile-cv`  
**Date**: 2026-11-09  
**Status**: Completed  

---

## 1. Architectural Overview & Storage Isolation

To uphold Principle I (Zero Candidate PII on Servers) and maximize in-browser responsiveness, candidate data lives strictly inside client-side IndexedDB (`mishoojobs_local_db`). The backend provides ephemeral, stateless transformation pipelines via `agy` CLI without database persistence.

```
+---------------------------------------------------------------------------------------+
|                               Client Browser (IndexedDB)                              |
|                                                                                       |
|  +------------------------+  +--------------------------+  +-----------------------+  |
|  |     master_profile     |  |   master_profile_photo   |  |        resumes        |  |
|  |------------------------|  |--------------------------|  |-----------------------|  |
|  | id: "current"          |  | id: "current"            |  | id: string (UUID)     |  |
|  | raw_yaml: string       |  | blob: Blob (max 512x512) |  | type: vacancy | role  |  |
|  | parsed: MasterProfile  |  | mime_type: string        |  | content: GeneratedCV  |  |
|  | updated_at: ISO8601    |  | updated_at: ISO8601      |  | template_id: string   |  |
|  +------------------------+  +--------------------------+  +-----------------------+  |
+---------------------------------------------------------------------------------------+
                                        ^
                                        | (Stateless ephemeral JSON / Multipart)
                                        v
+---------------------------------------------------------------------------------------+
|                            Backend (FastAPI + agy CLI)                                |
|   - POST /cv/parse-resume       (PDF/Markdown text extraction -> agy CLI -> YAML)     |
|   - POST /cv/generate-tailored  (Master Profile + Vacancy Context -> agy CLI -> CV)   |
|   - POST /cv/generate-role      (Master Profile + Role Archetype -> agy CLI -> CV)    |
|   * ZERO PostgreSQL candidate tables or candidate disk caching.                       |
+---------------------------------------------------------------------------------------+
```

---

## 2. Entity Definitions

### 2.1 Master Profile Entities (`frontend/src/types/master_profile.ts` & `backend/src/mishoojobs/schemas/master_profile.py`)

#### `PersonalInfo`
Candidate personal details and high-level contact identifiers.

| Field | Type | Required | Description |
|---|---|---|---|
| `full_name` | `string` | Yes | Candidate full legal / professional name |
| `headline` | `string` | Yes | Professional title (e.g. "Desarrollador Backend Junior \| Estudiante de Sistemas") |
| `email` | `string` (EmailStr) | Yes | Contact email address |
| `phone` | `string` | Yes | Contact phone number (Mexican standard +52 ...) |
| `location` | `string` | Yes | City and country (e.g. "Ciudad de México, México") |
| `website` | `string` (Url) | No | Personal portfolio or blog URL |
| `github` | `string` (Url) | No | GitHub profile URL |
| `linkedin` | `string` (Url) | No | LinkedIn profile URL |
| `photo` | `boolean` | Yes | Boolean flag indicating whether an avatar photo is enabled/stored in `master_profile_photo` table |

#### `CategorizedTechStack`
Hierarchical technical taxonomy reflecting engineering disciplines.

| Field | Type | Description |
|---|---|---|
| `backend` | `string[]` | Backend languages, frameworks, architectures (e.g. Python, FastAPI, Django, Go) |
| `frontend` | `string[]` | Frontend languages, libraries, styling (e.g. React, TypeScript, Tailwind CSS) |
| `databases` | `string[]` | Relational, NoSQL, in-memory, ORMs (e.g. PostgreSQL, Redis, MongoDB, SQLAlchemy) |
| `messaging_distributed` | `string[]` | Queues, event streaming, brokers (e.g. Kafka, RabbitMQ, Celery, BullMQ) |
| `ai_data` | `string[]` | Machine learning, data science, LLM tooling (e.g. PyTorch, Pandas, LangChain) |
| `devops_cloud` | `string[]` | Containers, cloud platforms, CI/CD (e.g. Docker, AWS, GCP, GitHub Actions) |
| `tools` | `string[]` | VCS, methodologies, testing suites (e.g. Git, Linux, Pytest, Vitest, Agile) |

#### `LanguageItem`
Spoken and written language proficiency.

| Field | Type | Description |
|---|---|---|
| `language` | `string` | Language name (e.g. "Español", "Inglés", "Alemán") |
| `level` | `string` | Proficiency scale (e.g. "Nativo", "B2 - Intermedio Avanzado", "C1 - Profesional") |

#### `ExperienceItem`
Historical employment, internships (*prácticas*, *residencias*), or freelance roles.

| Field | Type | Description |
|---|---|---|
| `company` | `string` | Employer or organization name |
| `role` | `string` | Job title held |
| `location` | `string?` | Office location or "Remoto" |
| `start_date` | `string` | Start date string (e.g. "Ene 2023") |
| `end_date` | `string` | End date string (e.g. "Presente" or "Nov 2024") |
| `current` | `boolean` | True if candidate currently holds this position |
| `highlights` | `string[]` | STAR-formatted bullet points (Situation, Task, Action, Result) |

#### `ProjectItem`
Independent software projects, open source contributions, or academic capstones.

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Project name |
| `description` | `string` | High-level summary of architecture and goal |
| `technologies` | `string[]` | Specific technologies utilized in the project |
| `link` | `string?` | Live demo, GitHub repo, or documentation link |
| `highlights` | `string[]` | Dense accomplishments and technical metrics |

#### `EducationItem`
Higher education, undergraduate degrees, technical diplomas (*TSU*).

| Field | Type | Description |
|---|---|---|
| `institution` | `string` | University or college name (e.g. "UNAM", "IPN", "Tec de Monterrey") |
| `degree` | `string` | Degree title (e.g. "Licenciatura en Informática", "Ingeniería en Software") |
| `field` | `string` | Academic discipline or major |
| `start_date` | `string` | Matriculation date |
| `end_date` | `string` | Graduation date or expected completion |
| `gpa` | `string?` | Optional average or academic standing (e.g. "9.4 / 10.0") |
| `current` | `boolean` | True if currently enrolled |

#### `CertificateItem`
Formal industry certifications and credentials.

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Certification name (e.g. "AWS Certified Cloud Practitioner") |
| `issuer` | `string` | Issuing body (e.g. "Amazon Web Services", "Coursera / DeepLearning.AI") |
| `issue_date` | `string` | Date of issue |
| `expiry_date` | `string?` | Expiration date if applicable |
| `credential_id` | `string?` | Verification code or license ID |
| `url` | `string?` | Verification URL |

#### `LogroAcademicoItem`
Academic competitions, hackathons, math/coding olympiads, and honors.

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Recognition title (e.g. "1er Lugar Hackathon HackMTY", "Mención Honorífica") |
| `organization` | `string` | Organizing institution or event |
| `date` | `string` | Date awarded |
| `description` | `string` | Brief description of challenge, project, and outcome |

#### Canonical `MasterProfileData`
Root document aggregating all sections:
```typescript
export interface MasterProfileData {
  personal_info: PersonalInfo;
  about_me: string;
  tech: CategorizedTechStack;
  languages: LanguageItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certificates: CertificateItem[];
  logros_academicos: LogroAcademicoItem[];
}
```

---

### 2.2 Generated Resume Entity (`frontend/src/types/resume.ts`)

Represents a tailored or role-based CV ready for preview, inline modification, and export.

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID v4) | Primary key in Dexie `resumes` table |
| `type` | `"vacancy" \| "role_archetype"` | Tailoring scenario |
| `title` | `string` | Display title (e.g. "Mercado Libre - Desarrollador Backend Jr") |
| `target_role` | `string` | Primary role title on CV |
| `language` | `"es" \| "en"` | Target generation language |
| `vacancy_fingerprint` | `string?` | Fingerprint of job vacancy if type === "vacancy" |
| `vacancy_company` | `string?` | Company name if linked to vacancy |
| `vacancy_title` | `string?` | Job title if linked to vacancy |
| `template_id` | `"technical_high_density" \| "classic_ats" \| "modern_executive"` | Selected layout template |
| `photo_enabled` | `boolean` | Whether photo is rendered on this resume |
| `content` | `GeneratedCVContent` | Detailed resume text blocks (see below) |
| `ats_match_score` | `number?` | Estimated ATS score (0-100) calculated against target posting |
| `revision` | `number` | Incremental revision number for duplicate generations |
| `created_at` | `string` (ISO 8601) | Creation timestamp |
| `updated_at` | `string` (ISO 8601) | Last modification timestamp |

#### `GeneratedCVContent` Structure
```typescript
export interface GeneratedCVContent {
  header: {
    full_name: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
    links: Array<{ label: string; url: string }>;
    about_me: string;
  };
  skills_categorized: Record<string, string[]>;
  languages: Array<{ language: string; level: string }>;
  experience: Array<{
    company: string;
    role: string;
    location?: string;
    period: string;
    highlights: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    link?: string;
    highlights: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    period: string;
    details?: string;
  }>;
  certificates: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  logros_academicos: Array<{
    title: string;
    organization: string;
    date: string;
    description: string;
  }>;
}
```

---

## 3. Dexie.js Schema & Migration (`frontend/src/db/index.ts`)

### Version 2 Upgrade Specification

```typescript
export class MishooJobsDatabase extends Dexie {
  // Existing tables
  candidate_profiles!: EntityTable<CandidateProfile, "id">; // Legacy / Deprecated
  applications!: EntityTable<ApplicationRecord, "vacancy_fingerprint">;
  preferences!: EntityTable<UserPreference, "key">;

  // New tables in Version 2
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
      // Retain version 1 stores
      candidate_profiles: "id, created_at, name",
      applications: "vacancy_fingerprint, status, updated_at",
      preferences: "key",

      // Add Version 2 stores
      master_profile: "id, updated_at",
      master_profile_photo: "id",
      resumes: "id, type, target_role, vacancy_fingerprint, created_at, updated_at",
    });
  }
}
```

---

## 4. State Transitions

```
[ New Candidate / Empty State ]
              |
              v
[ Master Profile Initialized with Starter YAML ]
              |
              +---> [ Direct YAML Edit in In-Browser Editor ] ---> Real-time Syntax Validation (Emerald/Rose)
              |
              +---> [ Upload .yml/.yaml File ] -------------> Ingest directly into Master Profile
              |
              +---> [ Upload PDF / Markdown ] --------------> POST /cv/parse-resume (Stateless agy CLI)
              |
              v
[ Valid Master Profile Saved in IndexedDB ]
              |
              +---> [ Universal Skill Scoring Active across Search Cards & Fit Checks ]
              |
              +---> [ Generate Vacancy-Tailored CV ] --------> POST /cv/generate-tailored
              |                                                               |
              +---> [ Generate Role Archetype CV ] ----------> POST /cv/generate-role
                                                                              |
                                                                              v
                                                          [ Saved to Resumes Table in IndexedDB ]
                                                                              |
                                                                              v
                                                          [ Live CV Viewer: High-Density Layout ]
                                                                              |
                                                                              +---> [ Inline Click-to-Edit ] ---> Auto-save to CV
                                                                              |          |
                                                                              |          +-> [ "Guardar en Perfil Maestro" ] (Selective push)
                                                                              |
                                                                              +---> [ Template Switch (3 Designs) ] (<100ms)
                                                                              |
                                                                              +---> [ Print Vector PDF ] (Calibrated 1-page @page)
                                                                              |
                                                                              +---> [ Copiar Texto ATS (Plano) / Markdown ]
```
