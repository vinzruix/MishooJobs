import re
import unicodedata
from typing import Any, Dict, Optional

from mishoojobs.schemas.job import AuditStatusEnum, SeniorityLevelEnum

class SeniorityClassifier:
    """Step 1 deterministic regex- and keyword-based seniority classifier (FR-002, FR-003, FR-005, FR-014).
    
    Provides sub-millisecond fast-pass classification during live SSE streaming and scraper parsing.
    """

    ENTRY_TITLE_PATTERNS = [
        r"\b(?:junior|jr|trainee|becari[oa]|practicante)\b",
    ]

    ACADEMIC_PATTERNS = [
        r"servicio\s+social",
        r"residencias?\s+profesionales?",
        r"pr[aá]cticas?\s+profesionales?",
        r"practicante",
        r"estanc[ií]as?",
        r"estad[ií]as?",
        r"formaci[oó]n\s+dual",
        r"becari[oa]",
        r"estudiante(?:s)?\s+(?:de\s+)?(?:[uú]ltimos\s+)?semestres?",
        r"estudiantes?\s+activos?",
        r"convenio\s+escolar",
        r"liberaci[oó]n\s+de\s+(?:servicio|pr[aá]cticas)",
    ]

    ZERO_EXP_PATTERNS = [
        r"\b(?:sin|0|cero)\s*(?:a[ñn]os?)\s*de\s*experiencia\b",
        r"\bsin\s+experiencia\b",
        r"\bno\s*(?:se\s*)?requiere\s*experiencia\b",
        r"\bexperiencia\s*(?:no\s*necesaria|no\s*requerida)\b",
        r"\bprimer\s*empleo\b",
        r"\breci[eé]n\s*egresad[oa]s?\b",
        r"\b(?:primera|ganar)\s+experiencia\b",
        r"\b0\s*a[ñn]os?\b",
    ]

    SENIOR_TITLE_PATTERNS = [
        r"\b(?:senior|sr\.?|tech\s*lead|arquitect[oa]|lead\s+developer|principal|director|gerente)\b",
    ]

    MID_TITLE_PATTERNS = [
        r"\b(?:mid|semi\s*senior|ssr\.?|intermedio)\b",
    ]

    UNPAID_OR_RISK_PATTERNS = [
        r"sin\s+remuneraci[oó]n",
        r"no\s+remunerad[ao]",
        r"sin\s+sueldo",
        r"voluntariado",
        r"100%?\s*comisi[oó]n",
        r"pago\s+de\s+uniforme",
        r"inversi[oó]n\s+inicial",
    ]

    @staticmethod
    def normalize_text(text: str) -> str:
        if not text:
            return ""
        nfkd = unicodedata.normalize("NFKD", text)
        no_accents = "".join(c for c in nfkd if not unicodedata.combining(c))
        return no_accents.lower()

    @classmethod
    def extract_years_required(cls, text: str) -> Optional[int]:
        """Extracts minimum required commercial years of experience from normalized text."""
        norm = cls.normalize_text(text)

        # Check explicit zero-experience declarations first
        for pat in cls.ZERO_EXP_PATTERNS:
            if re.search(pat, norm):
                # Ensure it's not followed by "pero deseable 2 años" in a way that overrides,
                # but if text explicitly states "sin experiencia" or "0 años de experiencia" or "recién egresado"
                # Check if there is also a requirement for 2+ years
                has_multi_years = re.search(r"(?:[2-9]|\d{2,})\s*(?:a|-)?\s*\d*\s*a[ñn]os?\s*(?:de\s*)?experiencia", norm)
                if not has_multi_years:
                    return 0

        # Pattern: "X a Y años" (e.g., "1 a 2 años", "2 a 4 años")
        range_match = re.search(r"(\d+)\s*(?:a|-)\s*(\d+)\s*a[ñn]os?", norm)
        if range_match:
            return int(range_match.group(1))

        # Pattern: "mínimo X años de experiencia", "al menos X años", "más de X años"
        min_match = re.search(r"(?:m[ií]nimo|al\s*menos|m[aá]s\s*de)\s*(\d+)\s*a[ñn]os?", norm)
        if min_match:
            return int(min_match.group(1))

        # Pattern: "experiencia mínima / de X años"
        exp_min_match = re.search(r"experiencia\s*(?:requerida|m[ií]nima|de|deseable)?\s*(?:al\s*menos\s*)?(\d+)\s*a[ñn]os?", norm)
        if exp_min_match:
            return int(exp_min_match.group(1))

        # Pattern: "X+ años de experiencia" or "X años de experiencia"
        plus_match = re.search(r"(\d+)\+?\s*a[ñn]os?\s*(?:de\s*)?experiencia", norm)
        if plus_match:
            return int(plus_match.group(1))

        # Pattern: "X años en / con ..."
        in_match = re.search(r"(\d+)\+?\s*a[ñn]os?\s*(?:en|con|laborales?|desarrollando)", norm)
        if in_match:
            return int(in_match.group(1))

        # Check explicit zero patterns again if no positive number was extracted
        for pat in cls.ZERO_EXP_PATTERNS:
            if re.search(pat, norm):
                return 0

        return None

    @classmethod
    def classify_fast(
        cls,
        title: str,
        text: str,
        is_scam: bool = False,
    ) -> Dict[str, Any]:
        """Performs fast-pass deterministic seniority classification.
        
        Returns dict matching VacancyDTO seniority fields.
        """
        title_norm = cls.normalize_text(title)
        text_norm = cls.normalize_text(text)
        combined_norm = f"{title_norm} {text_norm}"

        # 1. Check title markers
        is_entry_title = any(bool(re.search(pat, title_norm)) for pat in cls.ENTRY_TITLE_PATTERNS)
        is_senior_title = any(bool(re.search(pat, title_norm)) for pat in cls.SENIOR_TITLE_PATTERNS)
        is_mid_title = any(bool(re.search(pat, title_norm)) for pat in cls.MID_TITLE_PATTERNS)

        # 2. Check academic indicators
        is_academic_title = any(bool(re.search(pat, title_norm)) for pat in cls.ACADEMIC_PATTERNS)
        is_academic_text = any(bool(re.search(pat, combined_norm)) for pat in cls.ACADEMIC_PATTERNS)

        # 3. Check unpaid/scam markers
        has_unpaid_markers = any(bool(re.search(pat, combined_norm)) for pat in cls.UNPAID_OR_RISK_PATTERNS)

        # 4. Extract experience requirement
        years_min = cls.extract_years_required(text)
        if years_min is None:
            # Fallback check on title
            years_min = cls.extract_years_required(title)

        # 5. Check Fake Junior Discrepancy Shield (title claims entry/junior/intern/trainee but body demands >= 2 years)
        if is_entry_title and years_min is not None and years_min >= 2:
            if years_min >= 5:
                return {
                    "seniority_level": SeniorityLevelEnum.SENIOR,
                    "years_required_min": years_min,
                    "is_real_first_job": False,
                    "audit_status": AuditStatusEnum.PRELIMINARY,
                    "reasoning": "Título marcado como Junior pero el cuerpo exige 5+ años de experiencia laboral.",
                    "has_discrepancy": True,
                }
            else:
                return {
                    "seniority_level": SeniorityLevelEnum.MID,
                    "years_required_min": years_min,
                    "is_real_first_job": False,
                    "audit_status": AuditStatusEnum.PRELIMINARY,
                    "reasoning": "Título marcado como Junior pero el cuerpo exige 2+ años de experiencia laboral.",
                    "has_discrepancy": True,
                }

        # 6. Senior classification
        if (years_min is not None and years_min >= 5) or is_senior_title:
            req_years = max(years_min or 5, 5 if is_senior_title else 0)
            return {
                "seniority_level": SeniorityLevelEnum.SENIOR,
                "years_required_min": req_years,
                "is_real_first_job": False,
                "audit_status": AuditStatusEnum.PRELIMINARY,
                "reasoning": f"Requiere {req_years}+ años de experiencia o rol sénior/liderazgo técnico.",
                "has_discrepancy": False,
            }

        # 7. Mid classification
        if (years_min is not None and 2 <= years_min < 5) or is_mid_title:
            req_years = max(years_min or 2, 2 if is_mid_title else 0)
            return {
                "seniority_level": SeniorityLevelEnum.MID,
                "years_required_min": req_years,
                "is_real_first_job": False,
                "audit_status": AuditStatusEnum.PRELIMINARY,
                "reasoning": f"Requiere {req_years} años de experiencia intermedia.",
                "has_discrepancy": False,
            }

        # 8. Pasantía / Prácticas Profesionales (academic focus)
        if is_academic_title or (is_academic_text and not is_entry_title and years_min in (0, None)):
            return {
                "seniority_level": SeniorityLevelEnum.PASANTIA,
                "years_required_min": 0,
                "is_real_first_job": False,
                "audit_status": AuditStatusEnum.PRELIMINARY,
                "reasoning": "Posición académica o de prácticas/servicio social para estudiantes.",
                "has_discrepancy": False,
            }

        # 9. Authentic "Primer Empleo Real" (0 Exp, formal paid, non-academic)
        has_zero_exp_marker = any(bool(re.search(pat, combined_norm)) for pat in cls.ZERO_EXP_PATTERNS)
        if years_min == 0 or (has_zero_exp_marker and (years_min is None or years_min == 0)):
            is_real = not is_scam and not has_unpaid_markers and not is_academic_title
            reasoning = (
                "Vacante de primer empleo formal: no requiere experiencia laboral previa (0 años)."
                if is_real
                else "Posición sin experiencia pero con advertencia de remuneración o condiciones laborales."
            )
            return {
                "seniority_level": SeniorityLevelEnum.PRIMER_EMPLEO,
                "years_required_min": 0,
                "is_real_first_job": is_real,
                "audit_status": AuditStatusEnum.PRELIMINARY,
                "reasoning": reasoning,
                "has_discrepancy": False,
            }

        # 10. Junior (1 year or explicit Junior title with 1 year requirement)
        if years_min == 1 or (is_entry_title and not is_academic_title):
            return {
                "seniority_level": SeniorityLevelEnum.JUNIOR,
                "years_required_min": years_min if years_min is not None else 1,
                "is_real_first_job": False,
                "audit_status": AuditStatusEnum.PRELIMINARY,
                "reasoning": "Posición junior con requisito de 1 año de experiencia.",
                "has_discrepancy": False,
            }

        # 11. Ambiguous / Neutral Default (FR-014)
        return {
            "seniority_level": SeniorityLevelEnum.JUNIOR,
            "years_required_min": 0,
            "is_real_first_job": False,
            "audit_status": AuditStatusEnum.PRELIMINARY,
            "reasoning": "Posición con requisitos abiertos sin años especificados; asignada preliminarmente a Junior.",
            "has_discrepancy": False,
        }
