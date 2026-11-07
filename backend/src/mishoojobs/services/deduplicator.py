import hashlib
import re
import unicodedata
from typing import Dict, List, NamedTuple, Tuple
from pydantic import BaseModel, Field

from mishoojobs.schemas.job import VacancyDTO
from mishoojobs.services.scrapers.base import MEXICAN_STATE_MAP

class DeduplicationSummary(BaseModel):
    total_extracted: int = Field(default=0, ge=0)
    unique_vacancies: int = Field(default=0, ge=0)
    duplicates_merged: int = Field(default=0, ge=0)

class CrossPortalDeduplicator:
    """Service for cross-portal deduplication and merge of canonical job postings."""

    @staticmethod
    def normalize_string(text: str) -> str:
        """Normalizes string for robust identity comparison (lowercase, accent-free, trimmed)."""
        if not text:
            return ""
        nfkd = unicodedata.normalize("NFKD", text)
        no_accents = "".join(c for c in nfkd if not unicodedata.combining(c))
        clean = re.sub(r"[^\w\s]", "", no_accents)
        return re.sub(r"\s+", " ", clean.strip().lower())

    @classmethod
    def normalize_state(cls, state_text: str) -> str:
        norm = cls.normalize_string(state_text)
        for key, code in MEXICAN_STATE_MAP.items():
            if key in norm or norm in key:
                return code
        return norm.upper()

    def generate_fingerprint(self, company_name: str, title: str, location_state: str) -> str:
        """Generates canonical 64-character SHA-256 fingerprint."""
        norm_company = self.normalize_string(company_name)
        norm_title = self.normalize_string(title)
        norm_state = self.normalize_state(location_state)
        raw_key = f"{norm_company}:{norm_title}:{norm_state}"
        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    def merge_vacancies(self, existing: VacancyDTO, incoming: VacancyDTO) -> VacancyDTO:
        """Merges two duplicate vacancy postings into a unified canonical posting."""
        # Merge external links: 1 primary link per portal to prevent duplicate portal buttons
        existing_portals = {link.portal_name for link in existing.external_links}
        merged_links = list(existing.external_links)
        for link in incoming.external_links:
            if link.portal_name not in existing_portals:
                merged_links.append(link)
                existing_portals.add(link.portal_name)

        # Merge salaries: widen bounds
        sal_min = existing.salary_min
        if incoming.salary_min is not None:
            sal_min = min(sal_min, incoming.salary_min) if sal_min is not None else incoming.salary_min

        sal_max = existing.salary_max
        if incoming.salary_max is not None:
            sal_max = max(sal_max, incoming.salary_max) if sal_max is not None else incoming.salary_max

        # Merge skills
        existing_skills_lower = {s.lower() for s in existing.skills}
        merged_skills = list(existing.skills)
        for s in incoming.skills:
            if s.lower() not in existing_skills_lower:
                merged_skills.append(s)
                existing_skills_lower.add(s.lower())

        # Keep longer/cleaner description
        desc = existing.description if len(existing.description) >= len(incoming.description) else incoming.description

        # Keep most recent published_at date
        if not existing.published_at and incoming.published_at:
            existing.published_at = incoming.published_at
        elif existing.published_at and incoming.published_at:
            existing.published_at = max(existing.published_at, incoming.published_at)

        existing.external_links = merged_links
        existing.salary_min = sal_min
        existing.salary_max = sal_max
        existing.skills = merged_skills
        existing.description = desc
        return existing

    def deduplicate_batch(self, vacancies: List[VacancyDTO]) -> Tuple[List[VacancyDTO], DeduplicationSummary]:
        """Deduplicates a list of vacancies and computes summary metrics."""
        total_extracted = len(vacancies)
        vacancy_map: Dict[str, VacancyDTO] = {}
        duplicates_count = 0

        for v in vacancies:
            # Recompute canonical fingerprint to guarantee uniform hashing
            fp = self.generate_fingerprint(v.company_name, v.title, v.location_state)
            v.fingerprint = fp

            if fp in vacancy_map:
                vacancy_map[fp] = self.merge_vacancies(vacancy_map[fp], v)
                duplicates_count += 1
            else:
                vacancy_map[fp] = v

        unique_list = list(vacancy_map.values())
        summary = DeduplicationSummary(
            total_extracted=total_extracted,
            unique_vacancies=len(unique_list),
            duplicates_merged=duplicates_count,
        )
        return unique_list, summary
