import hashlib
from typing import List, Optional
from bs4 import BeautifulSoup

from mishoojobs.schemas.job import ExternalLinkDTO, PortalName, VacancyDTO
from mishoojobs.services.scrapers.base import AbstractBaseScraper

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
            data_id = card.get("data-id") or card.get("id", "").replace("jobcard-", "")

            if link_tag and link_tag.get("href"):
                href = link_tag.get("href", "")
                if href.startswith("/"):
                    direct_url = f"{self.base_url}{href}"
                else:
                    direct_url = href
            elif data_id:
                direct_url = f"https://www.occ.com.mx/empleo/oferta/{data_id}"
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
            category = self.infer_category(title, desc_text)
            skills = self.extract_skills(f"{title} {desc_text}")

            norm_company = self.normalize_text(company_name)
            norm_title = self.normalize_text(title)
            fingerprint = hashlib.sha256(f"{norm_company}:{norm_title}:{state}".encode("utf-8")).hexdigest()

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
                    category=category,
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

    async def search(
        self,
        query: str,
        location: Optional[str] = "México",
        modality: Optional[str] = "all",
        category: Optional[str] = "all",
        limit: int = 15,
    ) -> List[VacancyDTO]:
        q_slug = "-".join(self.normalize_text(query).split())
        url = f"{self.base_url}/empleos/de-{q_slug}"
        if location and location != "México":
            loc_slug = "-".join(self.normalize_text(location).split())
            url += f"/en-{loc_slug}"

        try:
            html = await self.fetch_html(url)
            vacancies = self.parse_html(html)
            return vacancies[:limit]
        except Exception:
            return []
