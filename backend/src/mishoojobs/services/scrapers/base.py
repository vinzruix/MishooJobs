import abc
import hashlib
import re
import unicodedata
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple
import bleach
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from mishoojobs.config import settings
from mishoojobs.schemas.job import VacancyDTO
from mishoojobs.services.seniority_classifier import SeniorityClassifier

COMMON_TECH_SKILLS = [
    "Python", "JavaScript", "TypeScript", "React", "Vue", "Angular", "Node.js", "Express",
    "FastAPI", "Django", "Flask", "Java", "Spring Boot", "C#", ".NET", "Golang", "Rust",
    "C++", "PHP", "Laravel", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Git", "GitHub", "Linux",
    "Tailwind CSS", "HTML", "CSS", "Next.js", "REST", "GraphQL", "CI/CD"
]

MEXICAN_STATE_MAP = {
    "aguascalientes": "AGS", "ags": "AGS",
    "baja california sur": "BCS", "bcs": "BCS",
    "baja california": "BC", "bc": "BC", "tijuana": "BC", "mexicali": "BC",
    "campeche": "CAMP",
    "chiapas": "CHIS", "tuxtla": "CHIS",
    "chihuahua": "CHIH", "juarez": "CHIH",
    "ciudad de mexico": "CDMX", "ciudad de méxico": "CDMX", "cdmx": "CDMX", "df": "CDMX", "distrito federal": "CDMX",
    "coahuila": "COAH", "saltillo": "COAH", "torreon": "COAH",
    "colima": "COL",
    "durango": "DGO",
    "estado de mexico": "EDO_MEX", "estado de méxico": "EDO_MEX", "edomex": "EDO_MEX", "toluca": "EDO_MEX",
    "guanajuato": "GTO", "leon": "GTO", "león": "GTO",
    "guerrero": "GRO", "acapulco": "GRO",
    "hidalgo": "HGO", "pachuca": "HGO",
    "jalisco": "JAL", "jal": "JAL", "guadalajara": "JAL", "zapopan": "JAL", "gdl": "JAL",
    "michoacan": "MICH", "michoacán": "MICH", "morelia": "MICH",
    "morelos": "MOR", "cuernavaca": "MOR",
    "nayarit": "NAY", "tepic": "NAY",
    "nuevo leon": "NL", "nuevo león": "NL", "nl": "NL", "monterrey": "NL", "mty": "NL",
    "oaxaca": "OAX",
    "puebla": "PUE",
    "queretaro": "QRO", "querétaro": "QRO", "qro": "QRO",
    "quintana roo": "QR", "cancun": "QR", "cancún": "QR",
    "san luis potosi": "SLP", "san luis potosí": "SLP", "slp": "SLP",
    "sinaloa": "SIN", "culiacan": "SIN", "culiacán": "SIN",
    "sonora": "SON", "hermosillo": "SON",
    "tabasco": "TAB", "villahermosa": "TAB",
    "tamaulipas": "TAMP", "reynosa": "TAMP", "matamoros": "TAMP",
    "tlaxcala": "TLAX",
    "veracruz": "VER",
    "yucatan": "YUC", "yucatán": "YUC", "merida": "YUC", "mérida": "YUC",
    "zacatecas": "ZAC",
    "remoto": "REMOTO", "remote": "REMOTO", "teletrabajo": "REMOTO", "home office": "REMOTO"
}

GENERIC_COMPANY_NAMES = {
    "empresa confidencial",
    "confidencial",
    "compania confidencial",
    "compañia confidencial",
    "compañía confidencial",
    "importante empresa",
    "importante empresa del sector",
    "importante empresa lider en su ramo",
    "importante empresa de tecnologia",
}

def is_generic_company(name: str) -> bool:
    """Detects whether a company name is an anonymous recruiter placeholder."""
    if not name:
        return True
    nfkd = unicodedata.normalize("NFKD", name)
    no_accents = "".join(c for c in nfkd if not unicodedata.combining(c))
    clean = re.sub(r"[^\w\s]", "", no_accents)
    norm = re.sub(r"\s+", " ", clean.strip().lower())
    if norm in GENERIC_COMPANY_NAMES:
        return True
    return "confidencial" in norm or "importante empresa" in norm

class AbstractBaseScraper(abc.ABC):
    """Abstract base class defining contract and shared utilities for Mexican job portal scrapers."""

    portal_name: str = "generic"

    def __init__(self):
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
        }

    @abc.abstractmethod
    def parse_html(self, html_content: str) -> List[VacancyDTO]:
        """Parses raw HTML from the portal into validated VacancyDTO instances."""
        pass

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=4))
    async def fetch_html(self, url: str, params: Optional[dict] = None) -> str:
        """Fetches raw HTML with timeout and retry logic."""
        async with httpx.AsyncClient(
            headers=self.headers,
            timeout=settings.scraper_timeout_seconds,
            follow_redirects=True,
        ) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return resp.text

    @abc.abstractmethod
    async def search(
        self,
        query: str,
        location: Optional[str] = "México",
        modality: Optional[str] = "all",
        seniority: Optional[str] = "all",
        limit: int = 15,
    ) -> List[VacancyDTO]:
        """Performs live query against the portal, returning up to `limit` vacancies."""
        pass

    def sanitize_text(self, text: Optional[str]) -> str:
        """Cleans and sanitizes HTML tags and dangerous characters."""
        if not text:
            return ""
        clean = bleach.clean(text, tags=[], strip=True)
        return " ".join(clean.split())

    def normalize_text(self, text: str) -> str:
        """Removes accents, converts to lowercase, and strips extra spaces."""
        nfkd = unicodedata.normalize("NFKD", text)
        no_accents = "".join(c for c in nfkd if not unicodedata.combining(c))
        return re.sub(r"\s+", " ", no_accents.strip().lower())

    @staticmethod
    def normalize_string(text: str) -> str:
        """Normalizes string for robust identity comparison (lowercase, accent-free, trimmed, punctuation stripped)."""
        if not text:
            return ""
        nfkd = unicodedata.normalize("NFKD", text)
        no_accents = "".join(c for c in nfkd if not unicodedata.combining(c))
        clean = re.sub(r"[^\w\s]", "", no_accents)
        return re.sub(r"\s+", " ", clean.strip().lower())

    def normalize_state(self, raw_location: Optional[str]) -> str:
        """Maps raw location string to canonical 2-4 letter Mexican state abbreviation or REMOTO."""
        if not raw_location:
            return "MEXICO"
        upper = raw_location.strip().upper()
        if upper in MEXICAN_STATE_MAP.values():
            return upper
        norm = self.normalize_text(raw_location)
        # Prioritize longer matching keys first (e.g. 'nuevo leon' before 'leon', 'baja california sur' before 'baja california')
        for key in sorted(MEXICAN_STATE_MAP.keys(), key=len, reverse=True):
            if key in norm:
                return MEXICAN_STATE_MAP[key]
        return "MEXICO"

    def generate_fingerprint(
        self,
        company_name: str,
        title: str,
        location_state: str,
        disambiguator: str = "",
    ) -> str:
        """Generates canonical 64-character SHA-256 fingerprint."""
        norm_company = self.normalize_string(company_name)
        norm_title = self.normalize_string(title)
        norm_state = self.normalize_state(location_state)

        if is_generic_company(norm_company) and disambiguator:
            clean_disambiguator = self.normalize_string(disambiguator.split("#")[0].split("?")[0])
            raw_key = f"{norm_company}:{norm_title}:{norm_state}:{clean_disambiguator}"
        else:
            raw_key = f"{norm_company}:{norm_title}:{norm_state}"

        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    def parse_mexican_salary(
        self, raw_text: Optional[str]
    ) -> Tuple[Optional[float], Optional[float], Optional[str]]:
        """Parses Mexican salary text into min, max, and period (semanal, quincenal, mensual, anual)."""
        if not raw_text:
            return (None, None, None)

        norm = self.normalize_text(raw_text)
        period = "mensual"
        if "semanal" in norm or "semana" in norm:
            period = "semanal"
        elif "quincenal" in norm or "quincena" in norm:
            period = "quincenal"
        elif "anual" in norm or "ano" in norm:
            period = "anual"

        # Extract dollar/peso amounts: e.g. $14,000, $ 22,999.00, 18000, etc.
        matches = re.findall(
            r"\$?\s*([0-9]{1,3}(?:[,\.][0-9]{3})*(?:\.[0-9]{2})?|[0-9]{4,6}(?:\.[0-9]{2})?)",
            raw_text,
        )
        clean_numbers = []
        for m in matches:
            val_str = m.replace(",", "")
            try:
                num = float(val_str)
                if num >= 1000:  # filter out stray day numbers or random digits
                    clean_numbers.append(num)
            except ValueError:
                continue

        if not clean_numbers:
            return (None, None, None)

        if len(clean_numbers) == 1:
            return (clean_numbers[0], clean_numbers[0], period)

        min_sal = min(clean_numbers[0], clean_numbers[1])
        max_sal = max(clean_numbers[0], clean_numbers[1])
        return (min_sal, max_sal, period)

    def parse_mexican_relative_date(
        self,
        raw_text: Optional[str],
        reference_dt: Optional[datetime] = None,
    ) -> Optional[datetime]:
        """Parses Mexican portal date snippets into UTC timezone-aware datetimes.

        Args:
            raw_text: Extracted text from portal HTML (e.g. 'Hace 3 horas', 'Publicado hoy').
            reference_dt: Reference datetime for relative offsets (defaults to datetime.now(timezone.utc)).

        Returns:
            datetime in UTC timezone, or None if unparseable/absent.
        """
        if not raw_text:
            return None

        if reference_dt is None:
            reference_dt = datetime.now(timezone.utc)
        elif reference_dt.tzinfo is None:
            reference_dt = reference_dt.replace(tzinfo=timezone.utc)

        norm = self.normalize_text(raw_text)

        def extract_count(pattern: str, text: str, default: int = 1) -> int:
            match = re.search(pattern, text)
            if match and match.group(1):
                try:
                    return int(match.group(1))
                except ValueError:
                    return default
            return default

        # "mas de un mes" or "mas de 1 mes" or "+ de 1 mes"
        if re.search(r"m[aá]s\s+de\s+(?:un|[0-9]+)\s+mes", norm) or re.search(r"\+\s*de\s+[0-9]+\s+mes", norm):
            count_match = re.search(r"m[aá]s\s+de\s+([0-9]+)\s+mes", norm)
            months = int(count_match.group(1)) if count_match else 1
            return reference_dt - timedelta(days=31 * months)

        # "un momento", "instante", "unos segundos"
        if re.search(r"\b(?:un\s+momento|unos\s+momentos|instante|segundos)\b", norm):
            return reference_dt

        # "hoy" or "publicad[oa]\s+hoy"
        if re.search(r"\bhoy\b", norm):
            return reference_dt

        # "ayer"
        if re.search(r"\bayer\b", norm):
            return reference_dt - timedelta(days=1)

        # "minuto(s)"
        if re.search(r"minuto", norm):
            n = extract_count(r"(\d+)\s*minuto", norm, default=1)
            return reference_dt - timedelta(minutes=n)

        # "hora(s)"
        if re.search(r"hora", norm):
            n = extract_count(r"(\d+)\s*hora", norm, default=1)
            return reference_dt - timedelta(hours=n)

        # "dia(s)"
        if re.search(r"d[ií]a", norm):
            n = extract_count(r"(\d+)\s*d[ií]a", norm, default=1)
            return reference_dt - timedelta(days=n)

        # "semana(s)"
        if re.search(r"semana", norm):
            n = extract_count(r"(\d+)\s*semana", norm, default=1)
            return reference_dt - timedelta(days=7 * n)

        # "mes(es)"
        if re.search(r"mes(?:es)?", norm):
            n = extract_count(r"(\d+)\s*mes", norm, default=1)
            return reference_dt - timedelta(days=30 * n)

        return None

    def extract_skills(self, text: str) -> List[str]:
        """Extracts recognizable technical skills using boundary-safe regex matching."""
        found = []
        lower_text = f" {text.lower()} "
        for skill in COMMON_TECH_SKILLS:
            pattern = rf"(?:\b|\s){re.escape(skill.lower())}(?:\b|\s)"
            if re.search(pattern, lower_text):
                found.append(skill)
        return found

    def classify_seniority_fast(self, title: str, text: str, is_scam: bool = False) -> dict:
        """Classifies vacancy seniority using deterministic Step 1 regex rules."""
        return SeniorityClassifier.classify_fast(title, text, is_scam=is_scam)

    def infer_modality(self, title: str, text: str) -> str:
        """Infers work modality from title and text."""
        combined = self.normalize_text(f"{title} {text}")
        if "hibrid" in combined:
            return "hibrido"
        if "remot" in combined or "home office" in combined or "teletrabajo" in combined:
            return "remoto"
        return "presencial"
