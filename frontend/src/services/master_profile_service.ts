import YAML from "yaml";
import { db } from "../db";
import type { MasterProfileData, MasterProfileRecord } from "../types/master_profile";

export interface ValidationResult {
  valid: boolean;
  error?: {
    line: number;
    column?: number;
    message: string;
  };
  parsed?: MasterProfileData;
}

export const STARTER_MASTER_PROFILE_YAML = `# ==============================================================================
# MISHOOJOBS - PERFIL MAESTRO (MASTER CAREER KNOWLEDGE BASE)
# Base canónica de conocimientos y experiencia profesional del candidato.
# Edita directamente este archivo. Se valida en tiempo real y se guarda en tu navegador.
# ==============================================================================

personal_info:
  full_name: "Santiago Mendoza Ruiz"
  headline: "Desarrollador Backend Junior | Estudiante de Ing. en Software"
  email: "santiago.mendoza@ciencias.unam.mx"
  phone: "+52 55 1234 5678"
  location: "Ciudad de México, México"
  website: "https://santiagomendoza.dev"
  github: "https://github.com/smendoza"
  linkedin: "https://linkedin.com/in/smendoza-dev"
  photo: true

about_me: >
  Estudiante de 8vo semestre enfocado en arquitecturas backend escalables, APIs REST con FastAPI
  y modelado de datos en PostgreSQL. Apasionado por el software libre, las buenas prácticas y el código limpio.

tech:
  backend:
    - "Python"
    - "FastAPI"
    - "Django"
  frontend:
    - "React"
    - "TypeScript"
    - "Tailwind CSS"
  databases:
    - "PostgreSQL"
    - "Redis"
    - "SQLAlchemy"
  messaging_distributed:
    - "RabbitMQ"
    - "Celery"
  ai_data:
    - "Pandas"
    - "NumPy"
  devops_cloud:
    - "Docker"
    - "Git"
    - "GitHub Actions"
  tools:
    - "Linux"
    - "Pytest"
    - "Postman"

languages:
  - language: "Español"
    level: "Nativo"
  - language: "Inglés"
    level: "B2 - Intermedio Avanzado"

experience:
  - company: "FinTech Soluciones MX"
    role: "Becario de Desarrollo Backend"
    location: "Ciudad de México (Híbrido)"
    start_date: "Ene 2024"
    end_date: "Presente"
    current: true
    highlights:
      - "Diseñé e implementé 6 endpoints REST con FastAPI y Pydantic para facturación CFDI 4.0, reduciendo tiempos en 25%."
      - "Optimicé consultas SQL mediante índices y vistas materializadas en PostgreSQL para transacciones de alto volumen."

projects:
  - name: "MishooJobs Core"
    description: "Plataforma de agregación y verificación de vacantes de empleo junior en México con streaming en tiempo real."
    technologies:
      - "Python"
      - "FastAPI"
      - "PostgreSQL"
      - "React"
      - "TypeScript"
    link: "https://github.com/smendoza/mishoojobs"
    highlights:
      - "Implementé pipeline de web scraping asíncrono con HTTPX y BeautifulSoup procesando más de 500 vacantes por minuto."
      - "Diseñé motor de detección de ofertas fraudulentas reduciendo falsos positivos a menos del 2%."

education:
  - institution: "Universidad Nacional Autónoma de México (UNAM)"
    degree: "Ingeniería en Computación"
    field: "Ciencias de la Computación"
    start_date: "Ago 2021"
    end_date: "Jun 2025"
    gpa: "9.2 / 10.0"
    current: true

certificates:
  - name: "AWS Certified Cloud Practitioner"
    issuer: "Amazon Web Services"
    issue_date: "Mar 2024"
    expiry_date: "Mar 2027"
    credential_id: "AWS-CCP-987654"
    url: "https://aws.amazon.com/verification"

logros_academicos:
  - title: "1er Lugar Hackathon HackMTY 2023"
    organization: "Tec de Monterrey"
    date: "Oct 2023"
    description: "Desarrollo de prototipo fintech para microcréditos estudiantiles en 36 horas continuas."
`;

export function getMasterProfileStarterTemplate(): string {
  return STARTER_MASTER_PROFILE_YAML;
}

export function parseAndValidateYAML(rawYaml: string): ValidationResult {
  const doc = YAML.parseDocument(rawYaml);
  if (doc.errors && doc.errors.length > 0) {
    const firstErr = doc.errors[0];
    const line = firstErr.linePos ? firstErr.linePos[0].line : 1;
    const col = firstErr.linePos ? firstErr.linePos[0].col : 1;
    return {
      valid: false,
      error: {
        line,
        column: col,
        message: firstErr.message || "Error de sintaxis YAML",
      },
    };
  }

  const parsed = doc.toJS();
  if (!parsed || typeof parsed !== "object") {
    return {
      valid: false,
      error: {
        line: 1,
        message: "El contenido YAML debe ser un objeto estructurado válido.",
      },
    };
  }

  // Required root sections check
  const requiredSections = [
    "personal_info",
    "about_me",
    "tech",
    "languages",
    "experience",
    "projects",
    "education",
    "certificates",
    "logros_academicos",
  ];

  for (const section of requiredSections) {
    if (!(section in parsed)) {
      return {
        valid: false,
        error: {
          line: 1,
          message: `Falta la sección obligatoria: '${section}'.`,
        },
      };
    }
  }

  if (!parsed.personal_info?.full_name || typeof parsed.personal_info.full_name !== "string") {
    return {
      valid: false,
      error: {
        line: 1,
        message: "Falta el campo obligatorio 'personal_info.full_name'.",
      },
    };
  }

  return {
    valid: true,
    parsed: parsed as MasterProfileData,
  };
}

export async function saveMasterProfile(
  rawYaml: string,
  parsed: MasterProfileData
): Promise<MasterProfileRecord> {
  const record: MasterProfileRecord = {
    id: "current",
    raw_yaml: rawYaml,
    parsed,
    updated_at: new Date().toISOString(),
  };

  await db.master_profile.put(record);
  return record;
}

export async function loadMasterProfile(): Promise<MasterProfileRecord> {
  const existing = await db.master_profile.get("current");
  if (existing) {
    return existing;
  }

  // Initialize with starter template
  const starterYaml = getMasterProfileStarterTemplate();
  const validation = parseAndValidateYAML(starterYaml);
  const record: MasterProfileRecord = {
    id: "current",
    raw_yaml: starterYaml,
    parsed: validation.parsed!,
    updated_at: new Date().toISOString(),
  };
  await db.master_profile.put(record);
  return record;
}

export function exportMasterProfileYAML(rawYaml: string, filename: string = "perfil_maestro.yml"): void {
  const blob = new Blob([rawYaml], { type: "text/yaml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
