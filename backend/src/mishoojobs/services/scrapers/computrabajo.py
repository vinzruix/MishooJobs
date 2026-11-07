import hashlib
from typing import List, Optional
from bs4 import BeautifulSoup

from mishoojobs.schemas.job import ExternalLinkDTO, PortalName, VacancyDTO
from mishoojobs.services.scrapers.base import AbstractBaseScraper

class ComputrabajoScraper(AbstractBaseScraper):
    """Scraper adapter for Computrabajo México."""

    portal_name: str = "computrabajo"
    base_url: str = "https://mx.computrabajo.com"

    def parse_html(self, html_content: str) -> List[VacancyDTO]:
        soup = BeautifulSoup(html_content, "html.parser")
        articles = soup.select("article.box_offer")
        vacancies: List[VacancyDTO] = []

        for article in articles:
            link_tag = article.select_one("a.js-o-link")
            if not link_tag:
                continue

            title = self.sanitize_text(link_tag.get_text())
            href = link_tag.get("href", "")
            if href.startswith("/"):
                direct_url = f"{self.base_url}{href}"
            else:
                direct_url = href

            # Extract company
            company_tag = (
                article.select_one("p.fs16 a")
                or article.select_one("p.dFlex a")
                or article.select_one("p.fs16 span")
                or article.select_one("p.fs16")
            )
            company_name = self.sanitize_text(company_tag.get_text()) if company_tag else "Empresa Confidencial"

            # Extract location (handles modern span.mr10 as well as fixture/legacy p.fs13.fc_aux)
            loc_tag = (
                article.select_one("p:not(.dFlex) span.mr10")
                or article.select_one("span.mr10:not(.fx_none)")
            )
            location_text = ""
            if loc_tag and not any(w in loc_tag.get_text().lower() for w in ["hace", "hoy", "ayer", "minuto", "hora", "día", "dia", "semana", "mes"]):
                location_text = loc_tag.get_text()
            else:
                for p in article.select("p.fs13.fc_aux"):
                    t = p.get_text()
                    if not any(w in t.lower() for w in ["hace", "hoy", "ayer", "minuto", "hora", "día", "dia", "semana", "mes"]):
                        if "$" not in t and "salario" not in t.lower() and "apoyo" not in t.lower():
                            location_text = t
                            break
            state = self.normalize_state(location_text)

            # Extract salary
            salary_tag = (
                article.select_one("span.icon.i_salary")
                or article.select_one("span[class*='salary']")
                or article.select_one("div[class*='salary']")
                or article.select_one("p[class*='salary']")
            )
            salary_text = ""
            if salary_tag:
                parent = salary_tag.parent or salary_tag
                salary_text = parent.get_text(separator=" ", strip=True)
            else:
                for elem in article.select("div.fs13, p.fs13, span.dIB, p, div"):
                    t = elem.get_text(separator=" ", strip=True)
                    if "$" in t or "salario" in t.lower() or "apoyo" in t.lower():
                        salary_text = t
                        break
            salary_min, salary_max, salary_period = self.parse_mexican_salary(salary_text)

            # Description snippet
            desc_tag = (
                article.select_one("p.fs13:not(.fc_aux)")
                or article.select_one("div.bRS p")
                or article.select_one("div.bRS")
            )
            desc_text = self.sanitize_text(desc_tag.get_text()) if desc_tag else ""
            if not desc_text or desc_text.lower() == title.lower() or len(desc_text) < 20:
                all_text = " ".join([elem.get_text(strip=True) for elem in article.select("p, span") if elem.get_text(strip=True)])
                desc_text = self.sanitize_text(all_text)

            # Extract publication date
            date_tag = (
                article.select_one("span.date")
                or article.select_one("p.fs13.fc_aux.date")
                or article.select_one("span[class*='date']")
            )
            raw_date = None
            if date_tag:
                raw_date = date_tag.get_text()
            else:
                for p in article.select("p.fs13.fc_aux, p.fs13, span"):
                    t = p.get_text()
                    if any(w in t.lower() for w in ["hace", "hoy", "ayer", "minuto", "hora", "día", "dia", "semana"]):
                        if "$" not in t and "salario" not in t.lower() and "apoyo" not in t.lower():
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
                portal_name=PortalName.COMPUTRABAJO,
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
        loc_slug = "-".join(self.normalize_text(location or "").split()) if location and location != "México" else ""
        
        path = f"/trabajo-de-{q_slug}"
        if loc_slug:
            path += f"-en-{loc_slug}"

        url = f"{self.base_url}{path}"
        try:
            html = await self.fetch_html(url)
            vacancies = self.parse_html(html)
            return vacancies[:limit]
        except Exception:
            return []
