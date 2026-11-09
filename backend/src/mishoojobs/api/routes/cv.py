import io
from typing import Any, Dict, List
from fastapi import APIRouter, File, HTTPException, UploadFile
import pypdf
import yaml

from mishoojobs.schemas.master_profile import MasterProfileSchema
from mishoojobs.schemas.resume import (
    ErrorResponse,
    GenerateCVResponse,
    GenerateRoleCVRequest,
    GenerateTailoredCVRequest,
    ParseResumeResponse,
)
from mishoojobs.services.agy_ai_client import AgyAIClient

router = APIRouter()
ai_client = AgyAIClient()


def _validate_profile_completeness(master_profile: Dict[str, Any]) -> None:
    """Validates that candidate profile has at least 1 experience or project and >= 2 skills."""
    experiences = master_profile.get("experience", [])
    projects = master_profile.get("projects", [])
    if not experiences and not projects:
        raise HTTPException(
            status_code=422,
            detail="Perfil incompleto: se requiere al menos 1 experiencia laboral o proyecto destacado en el Perfil Maestro.",
        )

    tech = master_profile.get("tech", {})
    all_skills: List[str] = []
    if isinstance(tech, dict):
        for skills in tech.values():
            if isinstance(skills, list):
                all_skills.extend(skills)

    if len(all_skills) < 2:
        raise HTTPException(
            status_code=422,
            detail="Perfil incompleto: se requieren al menos 2 habilidades técnicas registradas en el Perfil Maestro.",
        )


@router.post(
    "/parse-resume",
    response_model=ParseResumeResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Formato de archivo inválido o texto ilegible"},
        504: {"model": ErrorResponse, "description": "Tiempo de espera agotado con agy CLI"},
    },
    summary="Stateless Ephemeral Resume Parser",
)
async def parse_resume(file: UploadFile = File(...)) -> ParseResumeResponse:
    """Ingests PDF, Markdown, text, or YAML resume without persistent disk storage."""
    filename = (file.filename or "").lower()
    allowed_extensions = (".pdf", ".md", ".txt", ".yml", ".yaml")
    if not any(filename.endswith(ext) for ext in allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail=f"Formato de archivo no soportado. Formatos admitidos: {', '.join(allowed_extensions)}",
        )

    try:
        content_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al leer el archivo: {e}")

    warnings: List[str] = []
    raw_text = ""

    if filename.endswith((".yml", ".yaml")):
        try:
            yaml_str = content_bytes.decode("utf-8", errors="replace")
            parsed = yaml.safe_load(yaml_str)
            if isinstance(parsed, dict) and "personal_info" in parsed:
                validated = MasterProfileSchema.model_validate(parsed)
                canonical_yaml = yaml.dump(
                    validated.model_dump(),
                    sort_keys=False,
                    allow_unicode=True,
                    default_flow_style=False,
                )
                return ParseResumeResponse(yaml_content=canonical_yaml, warnings=warnings)
        except Exception as e:
            warnings.append(f"YAML no estricto: {e}. Procesando reestructuración con IA.")
            raw_text = content_bytes.decode("utf-8", errors="replace")

    elif filename.endswith(".pdf"):
        try:
            stream = io.BytesIO(content_bytes)
            reader = pypdf.PdfReader(stream)
            extracted_pages = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_pages.append(text)
            raw_text = "\n".join(extracted_pages).strip()
            if len(raw_text) < 10:
                raise ValueError("Texto insuficiente extraído del PDF.")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"No se pudo extraer texto del PDF: {e}")

    else:
        # Markdown or TXT
        raw_text = content_bytes.decode("utf-8", errors="replace").strip()
        if len(raw_text) < 10:
            raise HTTPException(status_code=400, detail="El archivo no contiene texto suficiente.")

    try:
        yaml_content, ai_warnings = await ai_client.parse_resume_to_yaml(raw_text)
        warnings.extend(ai_warnings)
        return ParseResumeResponse(yaml_content=yaml_content, warnings=warnings)
    except TimeoutError as te:
        raise HTTPException(status_code=504, detail=str(te))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Error durante la estructuración del CV: {ex}")


@router.post(
    "/generate-tailored",
    response_model=GenerateCVResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Perfil incompleto"},
        504: {"model": ErrorResponse, "description": "Tiempo de espera agotado con agy CLI"},
    },
    summary="Generate Vacancy-Tailored ATS CV",
)
async def generate_tailored_cv(payload: GenerateTailoredCVRequest) -> GenerateCVResponse:
    """Generates an ATS-optimized, 1-page CV tailored to a specific vacancy."""
    _validate_profile_completeness(payload.master_profile)

    try:
        result = await ai_client.generate_tailored_cv(
            master_profile=payload.master_profile,
            vacancy_title=payload.vacancy_title,
            vacancy_company=payload.vacancy_company,
            job_description=payload.job_description,
            desired_skills=payload.desired_skills,
            language=payload.language,
        )
        return GenerateCVResponse(
            content=result["content"],
            ats_match_score=result["ats_match_score"],
            word_count=result["word_count"],
            curation_notes=result.get("curation_notes"),
        )
    except TimeoutError as te:
        raise HTTPException(status_code=504, detail=str(te))
    except HTTPException:
        raise
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Error al generar CV adaptado: {ex}")


@router.post(
    "/generate-role",
    response_model=GenerateCVResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Perfil incompleto"},
        504: {"model": ErrorResponse, "description": "Tiempo de espera agotado con agy CLI"},
    },
    summary="Generate Role Archetype ATS CV",
)
async def generate_role_cv(payload: GenerateRoleCVRequest) -> GenerateCVResponse:
    """Generates an evergreen role archetype CV."""
    _validate_profile_completeness(payload.master_profile)

    try:
        result = await ai_client.generate_role_cv(
            master_profile=payload.master_profile,
            target_role_title=payload.target_role_title,
            focus_tags=payload.focus_tags,
            language=payload.language,
        )
        return GenerateCVResponse(
            content=result["content"],
            ats_match_score=result["ats_match_score"],
            word_count=result["word_count"],
            curation_notes=result.get("curation_notes"),
        )
    except TimeoutError as te:
        raise HTTPException(status_code=504, detail=str(te))
    except HTTPException:
        raise
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Error al generar CV por rol: {ex}")
