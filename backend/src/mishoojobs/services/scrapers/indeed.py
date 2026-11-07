import hashlib
from typing import List, Optional
from bs4 import BeautifulSoup

from mishoojobs.schemas.job import ExternalLinkDTO, PortalName, VacancyDTO
from mishoojobs.services.scrapers.base import AbstractBaseScraper

class IndeedScraper(AbstractBaseScraper):
    """Scraper adapter for Indeed México."""

    portal_name: str = "indeed"
    base_url: str = "https://mx.indeed.com"

    def parse_html(self, html_content: str) -> List[VacancyDTO]:
        soup = BeautifulSoup(html_content, "html.parser")
        cards = soup.select("div.job_seen_beacon")
        vacancies: List[VacancyDTO] = []

        for card in cards:
            link_tag = card.select_one("h2.jobTitle a") or card.select_one("a.jcs-JobTitle")
            if not link_tag:
                continue

            title = self.sanitize_text(link_tag.get_text())
            jk = link_tag.get("data-jk") or ""
            href = link_tag.get("href", "")

            if jk:
                direct_url = f"{self.base_url}/viewjob?jk={jk}"
            elif href.startswith("/"):
                direct_url = f"{self.base_url}{href}"
            else:
                direct_url = href

            company_tag = card.select_one("span[data-testid='company-name']") or card.select_one("span.companyName")
            company_name = self.sanitize_text(company_tag.get_text()) if company_tag else "Empresa Confidencial"

            loc_tag = card.select_one("div[data-testid='text-location']") or card.select_one("div.companyLocation")
            location_text = loc_tag.get_text() if loc_tag else ""
            state = self.normalize_state(location_text)

            salary_tag = card.select_one("div[data-testid='attribute_snippet_testid']") or card.select_one("div.salary-snippet-container")
            salary_text = salary_tag.get_text() if salary_tag else ""
            salary_min, salary_max, salary_period = self.parse_mexican_salary(salary_text)

            snippet_tag = card.select_one("div.job-snippet") or card.select_one("table.jobCardShelfContainer")
            desc_text = self.sanitize_text(snippet_tag.get_text()) if snippet_tag else title

            # Extract publication date
            date_tag = (
                card.select_one("span[data-testid='myJobsStateDate']")
                or card.select_one("span.date")
                or card.select_one("span[class*='date']")
                or card.select_one("span.dateSubheader")
            )
            raw_date = None
            if date_tag:
                raw_date = date_tag.get_text()
            else:
                for span in card.select("span, div"):
                    t = span.get_text()
                    if any(w in t.lower() for w in ["hace", "hoy", "ayer", "posted", "publicad"]):
                        if "$" not in t and "salario" not in t.lower():
                            raw_date = t
                            break
            published_at = self.parse_mexican_relative_date(raw_date)

            modality = self.infer_modality(title, f"{location_text} {desc_text}")
            category = self.infer_category(title, desc_text)
            skills = self.extract_skills(f"{title} {desc_text}")

            norm_company = self.normalize_text(company_name)
            norm_title = self.normalize_text(title)
            fingerprint = hashlib.sha256(f"{norm_company}:{norm_title}:{state}".encode("utf-8")).hexdigest()

            external_link = ExternalLinkDTO(
                portal_name=PortalName.INDEED,
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
                    category=category,
                    salary_min=salary_min,
                    salary_max=salary_max,
                    salary_period=salary_period,
                    currency="MXN",
                    description_clean=desc_text,
                    skills_extracted=skills,
                    published_at=published_at,
                    external_links=[external_link],
                )
            )

        return vacancies

    async def search(
        self,
        query: str,
        location: Optional[str] = "México",
        modality: Optional[str] = "all",
        category: Optional[str] = "all",
        limit: int = 15,
    ) -> List[VacancyDTO]:
        url = f"{self.base_url}/jobs"
        params = {"q": query, "l": location or "México"}
        try:
            html = await self.fetch_html(url, params=params)
            vacancies = self.parse_html(html)
            return vacancies[:limit]
        except Exception:
            return []
