import unicodedata
from typing import List, Optional, Set, Tuple

class HeuristicCompatibilityScorer:
    """Instant local heuristic skill-match scorer for calculating Tier 1 compatibility (SC-008)."""

    @staticmethod
    def normalize_skill(skill: str) -> str:
        """Normalizes skill token for exact/fuzzy comparison."""
        nfkd = unicodedata.normalize("NFKD", skill.strip())
        no_accents = "".join(c for c in nfkd if not unicodedata.combining(c))
        return no_accents.lower().replace(".", "").replace("-", "").replace(" ", "")

    def calculate_score(
        self,
        candidate_skills: List[str],
        job_skills: List[str],
        seniority_level: Optional[str] = None,
    ) -> Tuple[int, List[str], List[str]]:
        """Calculates instantaneous (0-100) compatibility score based on normalized skill token overlap and seniority calibration."""
        if not candidate_skills or not job_skills:
            return (0, [], job_skills)

        # Build candidate normalized set and lookup
        cand_map = {self.normalize_skill(s): s for s in candidate_skills}
        cand_norm_set: Set[str] = set(cand_map.keys())

        matched: List[str] = []
        missing: List[str] = []

        for j_skill in job_skills:
            j_norm = self.normalize_skill(j_skill)
            # Check direct equality or substring containment (e.g., 'python3' vs 'python', 'fastapi' vs 'api')
            found = False
            for c_norm in cand_norm_set:
                if j_norm == c_norm or (len(c_norm) >= 3 and len(j_norm) >= 3 and (c_norm in j_norm or j_norm in c_norm)):
                    matched.append(j_skill)
                    found = True
                    break
            if not found:
                missing.append(j_skill)

        total_req = len(job_skills)
        if total_req == 0:
            return (0, [], [])

        ratio = len(matched) / total_req
        score = min(100, max(0, int(round(ratio * 100))))

        if seniority_level:
            level = seniority_level.lower()
            if level in ["primer_empleo", "junior"]:
                pass
            elif level == "pasantia":
                score = min(100, max(0, int(round(score * 0.95))))
            elif level == "mid":
                score = min(100, max(0, int(round(score * 0.75))))
            elif level == "senior":
                score = min(100, max(0, int(round(score * 0.50))))

        return (score, matched, missing)
