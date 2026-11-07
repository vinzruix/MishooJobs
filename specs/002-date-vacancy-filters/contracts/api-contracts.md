# API Contracts: Date-Relevant Vacancy Filters (MishooJobs)

**Feature**: `002-date-vacancy-filters`  
**Date**: 2026-11-06  
**Status**: Complete  

---

## 1. Vacancy DTO Schema Contract

### Description
The schema defines the contract for individual job vacancy objects returned across HTTP endpoints and SSE streams.

### Schema: `VacancyDTO` (Pydantic v2)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "VacancyDTO",
  "type": "object",
  "required": [
    "fingerprint",
    "title",
    "company_name",
    "location_state",
    "modality",
    "category",
    "currency",
    "description_clean"
  ],
  "properties": {
    "fingerprint": {
      "type": "string",
      "pattern": "^[a-f0-9]{16,64}$",
      "description": "Deterministic SHA-256 hash identifying the unique vacancy."
    },
    "title": { "type": "string", "maxLength": 255 },
    "company_name": { "type": "string", "maxLength": 255 },
    "location_city": { "type": ["string", "null"], "maxLength": 100 },
    "location_state": { "type": "string", "maxLength": 50 },
    "modality": { "type": "string", "enum": ["presencial", "hibrido", "remoto"] },
    "category": {
      "type": "string",
      "enum": ["becario", "practicas", "residencias", "servicio_social", "dualidad", "trainee", "junior"]
    },
    "salary_min": { "type": ["number", "null"], "minimum": 0 },
    "salary_max": { "type": ["number", "null"], "minimum": 0 },
    "salary_period": { "type": ["string", "null"], "enum": ["semanal", "quincenal", "mensual", "anual", null] },
    "currency": { "type": "string", "enum": ["MXN"], "default": "MXN" },
    "description_clean": { "type": "string" },
    "skills_extracted": { "type": "array", "items": { "type": "string" } },
    "published_at": {
      "type": ["string", "null"],
      "format": "date-time",
      "description": "ISO 8601 UTC timestamp indicating when the job was published on the origin portal. Null if unparseable or omitted."
    },
    "first_discovered_at": { "type": ["string", "null"], "format": "date-time" },
    "last_verified_at": { "type": ["string", "null"], "format": "date-time" },
    "scam_report": { "$ref": "#/definitions/ScamReportResponse" },
    "external_links": {
      "type": "array",
      "items": { "$ref": "#/definitions/ExternalLinkDTO" }
    }
  }
}
```

---

## 2. Server-Sent Events (SSE) Stream Contract

### Endpoint
`GET /api/v1/jobs/stream?query={query}&location={location}&modality={modality}&category={category}`

### Event: `vacancy_batch`
Emitted as portal scrapers finish processing batches of verified vacancies.

```http
event: vacancy_batch
data: {
  "portal": "computrabajo",
  "vacancies": [
    {
      "fingerprint": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "title": "Desarrollador Python Junior",
      "company_name": "Tech Solutions México",
      "location_city": "Guadalajara",
      "location_state": "JAL",
      "modality": "hibrido",
      "category": "junior",
      "salary_min": 14000.0,
      "salary_max": 18000.0,
      "salary_period": "mensual",
      "currency": "MXN",
      "description_clean": "Buscamos programador junior...",
      "skills_extracted": ["Python", "FastAPI", "SQL", "Git"],
      "published_at": "2026-11-06T20:15:00Z",
      "first_discovered_at": "2026-11-06T22:00:00Z",
      "last_verified_at": "2026-11-06T22:00:00Z",
      "external_links": [
        {
          "portal_name": "computrabajo",
          "direct_url": "https://mx.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-1001",
          "is_active": true,
          "http_status_code": 200
        }
      ]
    }
  ]
}
```

---

## 3. Scraper Date Parser Contract (Internal Service)

### Method Signature
```python
def parse_mexican_relative_date(
    self,
    raw_text: Optional[str],
    reference_dt: Optional[datetime] = None
) -> Optional[datetime]:
    """
    Parses Mexican portal date snippets into UTC timezone-aware datetimes.

    Args:
        raw_text: Extracted text from portal HTML (e.g. 'Hace 3 horas', 'Publicado hoy').
        reference_dt: Reference datetime for relative offsets (defaults to datetime.now(timezone.utc)).

    Returns:
        datetime in UTC timezone, or None if unparseable/absent.
    """
```

### Deterministic Test Assertions
Given a fixed `reference_dt = datetime(2026, 11, 6, 12, 0, 0, tzinfo=timezone.utc)`:
- Input `"Hace 2 horas"` -> `datetime(2026, 11, 6, 10, 0, 0, tzinfo=timezone.utc)`
- Input `"Publicada hoy"` -> `datetime(2026, 11, 6, 12, 0, 0, tzinfo=timezone.utc)`
- Input `"Ayer"` -> `datetime(2026, 11, 5, 12, 0, 0, tzinfo=timezone.utc)`
- Input `"Hace 3 días"` -> `datetime(2026, 11, 3, 12, 0, 0, tzinfo=timezone.utc)`
- Input `"Hace 2 semanas"` -> `datetime(2026, 10, 23, 12, 0, 0, tzinfo=timezone.utc)`
- Input `"Salario negociable"` -> `None`
- Input `None` -> `None`
