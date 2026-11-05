import abc
import re
import unicodedata
from typing import List, Optional, Tuple
import bleach
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from mishoojobs.config import settings
from mishoojobs.schemas.job import VacancyDTO

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
        category: Optional[str] = "all",
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

    def normalize_state(self, raw_location: Optional[str]) -> str:
        """Maps raw location string to canonical 2-4 letter Mexican state abbreviation or REMOTO."""
        if not raw_location:
            return "MEXICO"
        norm = self.normalize_text(raw_location)
        for key, state_code in MEXICAN_STATE_MAP.items():
            if key in norm:
                return state_code
        return "MEXICO"

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

        # Extract dollar/peso amounts: e.g. $14,000, 18000, etc.
        matches = re.findall(r"\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]{4,6})", raw_text)
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

    def extract_skills(self, text: str) -> List[str]:
        """Extracts recognizable technical skills using boundary-safe regex matching."""
        found = []
        lower_text = f" {text.lower()} "
        for skill in COMMON_TECH_SKILLS:
            pattern = rf"(?:\b|\s){re.escape(skill.lower())}(?:\b|\s)"
            if re.search(pattern, lower_text):
                found.append(skill)
        return found

    def infer_category(self, title: str, text: str) -> str:
        """Infers Mexican early-career category from title and text."""
        combined = self.normalize_text(f"{title} {text}")
        if "servicio social" in combined:
            return "servicio_social"
        if "residencia" in combined:
            return "residencias"
        if "practica" in combined or "practicas" in combined:
            return "practicas"
        if "becari" in combined or "intern" in combined:
            return "becario"
        if "dual" in combined:
            return "dualidad"
        if "trainee" in combined:
            return "trainee"
        return "junior"

    def infer_modality(self, title: str, text: str) -> str:
        """Infers work modality from title and text."""
        combined = self.normalize_text(f"{title} {text}")
        if "hibrid" in combined:
            return "hibrido"
        if "remot" in combined or "home office" in combined or "teletrabajo" in combined:
            return "remoto"
        return "presencial"
