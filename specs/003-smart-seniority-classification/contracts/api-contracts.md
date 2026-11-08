# API & Interface Contracts: Smart Seniority Classification

**Feature Branch**: `003-smart-seniority-classification`  
**Date**: 2026-11-07  
**Status**: Completed  

---

## 1. REST & Streaming Endpoints

### 1.1 Live Job Stream: `GET /api/v1/jobs/stream`

Progressive Server-Sent Events (SSE) streaming endpoint returning concurrent verified listings from Mexican job portals.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | `string` | Yes | - | Role keywords (min 2, max 100 chars) |
| `location` | `string` | No | `"México"` | Target Mexican city or state |
| `modality` | `string` | No | `"all"` | `"all"`, `"remoto"`, `"hibrido"`, `"presencial"` |
| `seniority` | `string` | No | `"all"` | `"all"`, `"pasantia"`, `"primer_empleo"`, `"junior"`, `"mid"`, `"senior"` *(Replaces `category`)* |
| `limit_per_portal` | `integer` | No | `15` | Max listings per portal (1-15) |

#### SSE Events Emitted

##### Event: `vacancy_batch`
Emitted as each portal completes search and in-flight link verification:
```json
{
  "event": "vacancy_batch",
  "data": {
    "portal": "computrabajo",
    "vacancies": [
      {
        "fingerprint": "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
        "title": "Desarrollador Junior React / TypeScript",
        "company_name": "SoftDev México",
        "location_city": "Guadalajara",
        "location_state": "JAL",
        "modality": "hibrido",
        "seniority_level": "junior",
        "years_required_min": 1,
        "is_real_first_job": false,
        "audit_status": "preliminary",
        "reasoning": "Preclasificación rápida: solicita 1 año de experiencia en React.",
        "has_discrepancy": false,
        "salary_min": 18000.0,
        "salary_max": 24000.0,
        "salary_period": "mensual",
        "currency": "MXN",
        "description": "Buscamos desarrollador junior con al menos 1 año de experiencia...",
        "skills": ["React", "TypeScript", "Git"],
        "published_at": "2026-11-07T14:30:00Z",
        "external_links": [
          {
            "portal_name": "computrabajo",
            "direct_url": "https://mx.computrabajo.com/ofertas-de-trabajo/oferta-123",
            "is_active": true,
            "http_status_code": 200
          }
        ],
        "scam_report": {
          "risk_level": "safe",
          "risk_categories": [],
          "matched_indicators": [],
          "badge_label": "Verificada",
          "explanation": "No se detectaron riesgos de fraude."
        }
      }
    ]
  }
}
```

##### Event: `deduplication_summary`
Emitted after all scrapers finish, providing merged deduplicated listings:
```json
{
  "event": "deduplication_summary",
  "data": {
    "total_extracted": 32,
    "unique_vacancies": 27,
    "duplicates_merged": 5,
    "vacancies": [ /* Array of finalized VacancyDTOs */ ]
  }
}
```

---

### 1.2 On-Demand Seniority Deep AI Audit: `POST /api/v1/vacancies/{fingerprint}/audit`

Executes or retrieves a cached deep AI audit for a specific vacancy using `agy` CLI orchestration and PostgreSQL caching.

#### Request Headers
- `Content-Type: application/json`

#### Request Body (All fields optional; path parameter `{fingerprint}` is authoritative)
```json
{
  "vacancy_fingerprint": "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
  "direct_url": "https://mx.computrabajo.com/ofertas-de-trabajo/oferta-123",
  "job_description": "Texto opcional de la vacante si se tiene cargado en el cliente"
}
```

#### Response: `200 OK`
```json
{
  "vacancy_fingerprint": "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
  "seniority_level": "primer_empleo",
  "years_required_min": 0,
  "is_real_first_job": true,
  "audit_status": "verified",
  "reasoning": "La vacante no requiere experiencia laboral previa, ofrece sueldo formal por nómina y cuenta con programa de mentoría para recién egresados.",
  "has_discrepancy": false,
  "is_cached": false,
  "audited_at": "2026-11-07T19:15:00Z"
}
```

#### Error Responses
- `404 Not Found`: Vacancy fingerprint not recognized or not available in database.
- `504 Gateway Timeout`: `agy` CLI evaluation exceeded configured timeout (`AGY_TIMEOUT_SECONDS`).
- `500 Internal Server Error`: Parsing or CLI execution failure.

---

### 1.3 Resume Compatibility Evaluation: `POST /api/v1/vacancies/evaluate`

Updated to include seniority audit metadata in response payload if audited during the evaluation.

#### Request Body (Unchanged contract)
```json
{
  "vacancy_fingerprint": "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
  "target_role": "Junior Frontend Developer",
  "candidate_skills": ["React", "JavaScript", "HTML", "CSS"],
  "job_description": "Full job description...",
  "direct_url": "https://mx.computrabajo.com/ofertas-de-trabajo/oferta-123",
  "desired_skills": ["React", "TypeScript", "Tailwind CSS"]
}
```

#### Response Body (`AIEvaluationResponse`)
```json
{
  "fit_score": 85,
  "fit_tier": "high",
  "matched_skills": ["React", "JavaScript", "HTML", "CSS"],
  "missing_skills": ["TypeScript"],
  "role_readiness_summary": "Excelente perfil para la posición junior...",
  "actionable_advice": "Desarrolla un proyecto personal migrando tus componentes a TypeScript.",
  "is_cached": false,
  "evaluated_at": "2026-11-07T19:15:30Z",
  "full_description": "Full enriched job description...",
  "extracted_skills": ["React", "TypeScript", "Tailwind CSS", "Git"],
  "seniority_audit": {
    "seniority_level": "junior",
    "years_required_min": 1,
    "is_real_first_job": false,
    "audit_status": "verified",
    "reasoning": "Exige 1 año de experiencia comprobable en React.",
    "has_discrepancy": false
  }
}
```

---

## 2. Client-Side URL Synchronization Contract

The web application keeps active filter state in sync with URL search params:

| URL Query Parameter | Permitted Values | Default | Effect |
|---|---|---|---|
| `?query=` | string | `""` | Search text filter |
| `?location=` | string | `"México"` | Location text filter |
| `?seniority=` | `primer_empleo`, `pasantia`, `junior`, `mid`, `senior` | Omitted (`all`) | Filters displayed vacancies to selected experience tier |
| `?published_within=` | `1h`, `24h`, `3d`, `7d`, `30d` | Omitted (`all`) | Publication timeframe filter |
| `?sort=` | `recent`, `compatibility`, `relevance` | Contextual | Ordering mode |

### Navigation Behaviors
- **Setting Tier**: Selecting a filter pill updates URL (`window.history.pushState` or query sync) to `?seniority=<value>`.
- **Resetting Tier**: Selecting "Todos los niveles" or clicking the active tier removes `?seniority` from the URL.
- **Browser History**: Pressing Back / Forward parses the updated `?seniority` parameter and renders the matching vacancies instantly.
- **Invalid Parameter**: If `?seniority=invalid_foo` is supplied, the app gracefully falls back to `"all"` without errors.
