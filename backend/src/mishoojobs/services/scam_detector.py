import re
import unicodedata
from typing import List, Tuple
from mishoojobs.schemas.scam import RiskLevelEnum, ScamCategoryEnum, ScamReportResponse

class MexicanScamDetector:
    """Deterministic pattern recognition engine detecting deceptive and predatory Mexican job listings (FR-012, FR-013)."""

    MLM_PATTERNS = [
        r"3000\s*(?:a|-)\s*5000\s*semanales",
        r"actividades\s+sencillas\s+de\s+oficina",
        r"se\s+tu\s+propio\s+jefe",
        r"sin\s+experiencia\s+ingresos\s+altos",
        r"armar\s+(?:paquetes|cajas)\s+desde\s+casa",
        r"llenar\s+sobres",
        r"esquema\s+multinivel",
        r"ganancias\s+inmediatas\s+sin\s+esfuerzo",
    ]

    FEE_PATTERNS = [
        r"pago\s+de\s+uniforme",
        r"costo\s+de\s+uniforme",
        r"material\s+de\s+capacitaci[oó]n",
        r"dep[oó]sito\s+(?:para|por)\s+examen",
        r"pago\s+por\s+tr[aá]mite",
        r"inversi[oó]n\s+inicial\s+para\s+(?:ingresar|comenzar)",
        r"adquirir\s+kit\s+de\s+inicio",
    ]

    COMMISSION_PATTERNS = [
        r"100%?\s*comisi[oó]n",
        r"solo\s+comisi[oó]n",
        r"sin\s+sueldo\s+base",
        r"ganancias\s+exclusivamente\s+por\s+comisi[oó]n",
    ]

    UNPAID_PATTERNS = [
        r"sin\s+remuneraci[oó]n",
        r"no\s+remunerad[ao]",
        r"sin\s+sueldo",
        r"voluntariado\s+de\s+tiempo\s+completo",
    ]

    FOREIGN_VISA_PATTERNS = [
        r"us\s+citizen\s+only",
        r"green\s+card\s+holder\s+only",
        r"security\s+clearance\s+required",
        r"must\s+be\s+authorized\s+to\s+work\s+in\s+the\s+us\s+without\s+sponsorship",
        r"us\s+citizenship\s+required",
    ]

    @staticmethod
    def normalize_text(text: str) -> str:
        nfkd = unicodedata.normalize("NFKD", text)
        no_accents = "".join(c for c in nfkd if not unicodedata.combining(c))
        return no_accents.lower()

    def is_foreign_visa_restricted(self, title: str, description: str) -> bool:
        """Returns True if posting requires US citizenship or excludes foreign workers."""
        combined = f"{title.lower()} {description.lower()}"
        for pattern in self.FOREIGN_VISA_PATTERNS:
            if re.search(pattern, combined):
                return True
        return False

    def assess_vacancy(self, title: str, description: str) -> ScamReportResponse:
        """Evaluates vacancy against predatory patterns, classifying risk as safe, warning, or critical."""
        combined = f"{title} {description}"
        norm = self.normalize_text(combined)

        categories: List[str] = []
        matched_indicators: List[str] = []

        # 1. Critical: MLM / Pyramid Scheme
        for pattern in self.MLM_PATTERNS:
            match = re.search(pattern, norm)
            if match:
                categories.append(ScamCategoryEnum.MLM_SCHEME.value)
                matched_indicators.append(match.group(0))
                break

        # 2. Critical: Candidate Fee
        for pattern in self.FEE_PATTERNS:
            match = re.search(pattern, norm)
            if match:
                categories.append(ScamCategoryEnum.CANDIDATE_FEE.value)
                matched_indicators.append(match.group(0))
                break

        # 3. Warning: 100% Commission
        for pattern in self.COMMISSION_PATTERNS:
            match = re.search(pattern, norm)
            if match:
                categories.append(ScamCategoryEnum.COMMISSION_ONLY.value)
                matched_indicators.append(match.group(0))
                break

        # 4. Warning: Unpaid Labor
        for pattern in self.UNPAID_PATTERNS:
            match = re.search(pattern, norm)
            if match:
                categories.append(ScamCategoryEnum.UNPAID_LABOR.value)
                matched_indicators.append(match.group(0))
                break

        # 5. Foreign Visa Restriction
        for pattern in self.FOREIGN_VISA_PATTERNS:
            match = re.search(pattern, combined.lower())
            if match:
                categories.append(ScamCategoryEnum.FOREIGN_VISA_RESTRICTION.value)
                matched_indicators.append(match.group(0))
                break

        # Determine Risk Level and Badge Label
        if ScamCategoryEnum.MLM_SCHEME.value in categories:
            return ScamReportResponse(
                risk_level=RiskLevelEnum.CRITICAL,
                risk_categories=categories,
                matched_indicators=matched_indicators,
                badge_label="[POSIBLE FRAUDE / PIRAMIDAL]",
                explanation="Esta publicación coincide con patrones típicos de reclutamiento engañoso o redes multinivel con promesas de ingresos desproporcionadas.",
            )

        if ScamCategoryEnum.CANDIDATE_FEE.value in categories:
            return ScamReportResponse(
                risk_level=RiskLevelEnum.CRITICAL,
                risk_categories=categories,
                matched_indicators=matched_indicators,
                badge_label="[COBRO A CANDIDATO]",
                explanation="Exigir pagos por uniformes, exámenes o trámites para ingresar a un empleo está prohibido por la Ley Federal del Trabajo en México.",
            )

        if ScamCategoryEnum.COMMISSION_ONLY.value in categories:
            return ScamReportResponse(
                risk_level=RiskLevelEnum.WARNING,
                risk_categories=categories,
                matched_indicators=matched_indicators,
                badge_label="[100% COMISIÓN]",
                explanation="Esta vacante no ofrece un sueldo base garantizado; el ingreso depende exclusivamente de comisiones o ventas individuales.",
            )

        if ScamCategoryEnum.UNPAID_LABOR.value in categories:
            return ScamReportResponse(
                risk_level=RiskLevelEnum.WARNING,
                risk_categories=categories,
                matched_indicators=matched_indicators,
                badge_label="[TRABAJO NO REMUNERADO]",
                explanation="La vacante solicita actividades laborales o prácticas profesionales sin brindar apoyo económico ni remuneración.",
            )

        if ScamCategoryEnum.FOREIGN_VISA_RESTRICTION.value in categories:
            return ScamReportResponse(
                risk_level=RiskLevelEnum.WARNING,
                risk_categories=categories,
                matched_indicators=matched_indicators,
                badge_label="[RESTRICCIÓN DE VISA]",
                explanation="Esta oferta está restringida para ciudadanos estadounidenses o residentes legales de ese país y no ofrece patrocinio para México.",
            )

        return ScamReportResponse(
            risk_level=RiskLevelEnum.SAFE,
            risk_categories=[],
            matched_indicators=[],
            badge_label="VERIFICADO SEGURO",
            explanation="No se detectaron indicios de esquemas piramidales o cobros al candidato.",
        )
