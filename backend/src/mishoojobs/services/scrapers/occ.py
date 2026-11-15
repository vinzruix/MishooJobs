import asyncio
import logging
import re
from typing import List, Optional
from urllib.parse import parse_qs, urlparse
from bs4 import BeautifulSoup
import httpx

from mishoojobs.schemas.job import ExternalLinkDTO, PortalName, VacancyDTO
from mishoojobs.services.scrapers.base import AbstractBaseScraper

logger = logging.getLogger(__name__)

OCC_OFFER_JSON_URL = "https://oferta.occ.com.mx/offer/{offer_id}/d/j?ipo=41&iapo=1"

def extract_occ_offer_id(url: str) -> Optional[str]:
    """Extracts the OCC offer ID from `?jobid=<id>` or `/empleo/oferta/<id>` URLs."""
    if not url:
        return None
    parsed = urlparse(url)
    if parsed.netloc and "occ.com.mx" not in parsed.netloc.lower():
        return None
    qs = parse_qs(parsed.query)
    jobid_vals = qs.get("jobid")
    if jobid_vals and jobid_vals[0].strip():
        return jobid_vals[0].strip()
    match = re.search(r"/empleo/oferta/(\d+)", parsed.path)
    if match:
        return match.group(1)
    return None

class OCCScraper(AbstractBaseScraper):
    """Scraper adapter for OCC Mundial."""

    portal_name: str = "occ"
    base_url: str = "https://www.occ.com.mx"

    def parse_html(self, html_content: str) -> List[VacancyDTO]:
        soup = BeautifulSoup(html_content, "html.parser")
        cards = soup.select(
            "li.vacancy-card, [data-vacancy-card], div.occ-job-card, div.job-card-content, div[id*='jobcard']"
        )
        vacancies: List[VacancyDTO] = []

        for card in cards:
            link_tag = (
                card.select_one("a[href*='/empleo/oferta/']")
                or card.select_one("a[href*='/empleo/']")
                or card.select_one("h2 a")
                or card.select_one("a")
            )
            raw_data_id = card.get("data-id") or card.get("id", "").replace("jobcard-", "")
            data_id = str(raw_data_id).strip() if raw_data_id else ""

            if link_tag and link_tag.get("href"):
                href = link_tag.get("href", "")
                if href.startswith("/"):
                    direct_url = f"{self.base_url}{href}"
                else:
                    direct_url = href
            elif data_id:
                # Modern OCC split-grid cards omit <a> tags; ?jobid= opens the active offer panel directly
                direct_url = f"{self.base_url}/empleos/?jobid={data_id}"
            else:
                continue

            title_tag = (
                card.select_one(".vacancy-card__title")
                or card.select_one("h2.title a")
                or card.select_one(".title")
                or card.select_one("h2")
            )
            if not title_tag:
                continue

            title = self.sanitize_text(title_tag.get_text())

            comp_tag = (
                card.select_one(".vacancy-card__company-text")
                or card.select_one(".company-name")
                or card.select_one("p[class*='company']")
                or card.select_one("span.company")
            )
            company_name = self.sanitize_text(comp_tag.get_text()) if comp_tag else "Empresa Confidencial"

            loc_tag = (
                card.select_one(".vacancy-card__location span:first-child")
                or card.select_one(".vacancy-card__location")
                or card.select_one(".location")
                or card.select_one("p[class*='location']")
            )
            location_text = loc_tag.get_text() if loc_tag else ""
            state = self.normalize_state(location_text)

            salary_tag = (
                card.select_one(".vacancy-card__salary")
                or card.select_one(".salary")
                or card.select_one('p[class*="salary"]')
                or card.select_one('[class*="salary"]')
            )
            salary_text = salary_tag.get_text(separator=" ", strip=True) if salary_tag else ""
            salary_min, salary_max, salary_period = self.parse_mexican_salary(salary_text)

            desc_tag = (
                card.select_one(".vacancy-card__benefits")
                or card.select_one(".description")
                or card.select_one("p")
            )
            desc_text = self.sanitize_text(desc_tag.get_text()) if desc_tag else ""
            if not desc_text or desc_text.lower() == title.lower():
                all_text = " ".join([elem.get_text(strip=True) for elem in card.select("li, p, span") if elem.get_text(strip=True)])
                desc_text = self.sanitize_text(all_text)

            # Extract publication date
            date_tag = (
                card.select_one(".vacancy-card__location span:last-child")
                or card.select_one(".date")
                or card.select_one("span[class*='date']")
                or card.select_one("p[class*='date']")
                or card.select_one("span.published")
            )
            raw_date = None
            if date_tag:
                raw_date = date_tag.get_text()
            else:
                for elem in card.select("span, div, p"):
                    t = elem.get_text()
                    if any(w in t.lower() for w in ["hace", "hoy", "ayer", "publicad"]):
                        if "$" not in t and "salario" not in t.lower():
                            raw_date = t
                            break
            published_at = self.parse_mexican_relative_date(raw_date)

            modality = self.infer_modality(title, f"{location_text} {desc_text}")
            sen_info = self.classify_seniority_fast(title, desc_text)
            skills = self.extract_skills(f"{title} {desc_text}")

            fingerprint = self.generate_fingerprint(company_name, title, state, disambiguator=direct_url)

            external_link = ExternalLinkDTO(
                portal_name=PortalName.OCC,
                direct_url=direct_url,
                is_active=True,
                http_status_code=200,
            )

            vacancies.append(
                VacancyDTO(
                    fingerprint=fingerprint,
                    title=title,
                    company_name=company_name,
                    location_city=self.sanitize_text(location_text).split(",")[0] if "," in location_text else None,
                    location_state=state,
                    modality=modality,
                    seniority_level=sen_info["seniority_level"],
                    years_required_min=sen_info["years_required_min"],
                    is_real_first_job=sen_info["is_real_first_job"],
                    audit_status=sen_info["audit_status"],
                    reasoning=sen_info["reasoning"],
                    has_discrepancy=sen_info["has_discrepancy"],
                    salary_min=salary_min,
                    salary_max=salary_max,
                    salary_period=salary_period,
                    currency="MXN",
                    description=desc_text,
                    skills=skills,
                    published_at=published_at,
                    external_links=[external_link],
                )
            )

        return vacancies

    def _parse_description_from_json(self, payload: dict) -> Optional[str]:
        """Extracts and sanitizes the HTML job description from OCC's offer JSON payload."""
        if not isinstance(payload, dict):
            return None
        offer_data = payload.get("o")
        if not isinstance(offer_data, dict):
            return None
        raw_html = offer_data.get("ld")
        if not raw_html or not isinstance(raw_html, str):
            return None
        soup = BeautifulSoup(raw_html, "html.parser")
        text = self.sanitize_text(soup.get_text("\n", strip=True))
        return text or None

    def _parse_description_from_html(self, html_content: str) -> Optional[str]:
        """Extracts and sanitizes the job description from an OCC offer HTML page."""
        soup = BeautifulSoup(html_content, "html.parser")
        rich = soup.select_one("div.rich-text, div.break-words")
        if not rich:
            return None
        text = self.sanitize_text(rich.get_text("\n", strip=True))
        return text or None

    def _apply_enriched_description(self, vacancy: VacancyDTO, full_text: str) -> None:
        """Updates vacancy description, extracted skills, and seniority when richer text is found."""
        if len(full_text) <= len(vacancy.description):
            return
        vacancy.description = full_text
        vacancy.skills = self.extract_skills(f"{vacancy.title} {full_text}")
        up_sen = self.classify_seniority_fast(vacancy.title, full_text)
        vacancy.seniority_level = up_sen["seniority_level"]
        vacancy.years_required_min = up_sen["years_required_min"]
        vacancy.is_real_first_job = up_sen["is_real_first_job"]
        vacancy.audit_status = up_sen["audit_status"]
        vacancy.reasoning = up_sen["reasoning"]
        vacancy.has_discrepancy = up_sen["has_discrepancy"]

    async def _fetch_offer_json_description(self, offer_id: str, client: httpx.AsyncClient) -> Optional[str]:
        """Fetches full vacancy description from OCC's offer detail JSON endpoint."""
        try:
            resp = await client.get(OCC_OFFER_JSON_URL.format(offer_id=offer_id))
            if resp.status_code == 200 and resp.content:
                return self._parse_description_from_json(resp.json())
        except (httpx.HTTPError, ValueError, asyncio.TimeoutError) as exc:
            logger.debug("OCC JSON description fetch failed for offer %s: %s", offer_id, exc)
        return None

    async def _fetch_offer_html_description(self, direct_url: str) -> Optional[str]:
        """Fallback HTML description fetch for standalone /empleo/oferta/ pages."""
        try:
            from curl_cffi.requests import AsyncSession
            async with AsyncSession(impersonate="chrome") as s:
                r = await s.get(direct_url, timeout=6)
                if r.status_code == 200:
                    parsed = self._parse_description_from_html(r.text)
                    if parsed:
                        return parsed
        except (ImportError, OSError, asyncio.TimeoutError) as exc:
            logger.debug("OCC curl_cffi HTML fetch failed for %s: %s", direct_url, exc)

        try:
            async with httpx.AsyncClient(headers=self.headers, timeout=6.0, follow_redirects=True) as client:
                resp = await client.get(direct_url)
                if resp.status_code == 200:
                    return self._parse_description_from_html(resp.text)
        except (httpx.HTTPError, asyncio.TimeoutError) as exc:
            logger.debug("OCC httpx HTML fetch failed for %s: %s", direct_url, exc)
        return None

    async def fetch_full_description(self, direct_url: str) -> Optional[str]:
        """Fetches the full vacancy description body from OCC's JSON API or legacy HTML page."""
        offer_id = extract_occ_offer_id(direct_url)
        if offer_id:
            async with httpx.AsyncClient(headers=self.headers, timeout=6.0) as client:
                json_desc = await self._fetch_offer_json_description(offer_id, client)
                if json_desc:
                    return json_desc

        if "/empleo/oferta/" in direct_url or not offer_id:
            return await self._fetch_offer_html_description(direct_url)
        return None

    async def search(
        self,
        query: str,
        location: Optional[str] = "México",
        modality: Optional[str] = "all",
        seniority: Optional[str] = "all",
        limit: int = 15,
    ) -> List[VacancyDTO]:
        q_slug = "-".join(self.normalize_text(query).split())
        url = f"{self.base_url}/empleos/de-{q_slug}"
        if location and location != "México":
            loc_slug = "-".join(self.normalize_text(location).split())
            url += f"/en-{loc_slug}"

        try:
            html = await self.fetch_html(url)
            vacancies = self.parse_html(html)[:limit]
        except (httpx.HTTPError, asyncio.TimeoutError) as exc:
            logger.warning("OCC search fetch failed for %s: %s", url, exc)
            return []

        if not vacancies:
            return vacancies

        # Concurrently enrich vacancies via OCC's offer JSON endpoint (fallback to HTML only for /empleo/oferta/)
        async with httpx.AsyncClient(headers=self.headers, timeout=6.0) as client:
            async def enrich_one(v: VacancyDTO) -> None:
                if not v.external_links:
                    return
                offer_url = v.external_links[0].direct_url
                offer_id = extract_occ_offer_id(offer_url)
                full_text = None
                if offer_id:
                    full_text = await self._fetch_offer_json_description(offer_id, client)
                if not full_text and "/empleo/oferta/" in offer_url:
                    full_text = await self._fetch_offer_html_description(offer_url)
                if full_text:
                    self._apply_enriched_description(v, full_text)

            await asyncio.gather(*(enrich_one(v) for v in vacancies))

        return vacancies
