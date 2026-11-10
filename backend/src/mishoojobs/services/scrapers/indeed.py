import asyncio
import hashlib
import json
import re
from datetime import datetime, timezone
from typing import List, Optional
import bleach
from bs4 import BeautifulSoup

from mishoojobs.schemas.job import ExternalLinkDTO, PortalName, VacancyDTO
from mishoojobs.services.scrapers.base import AbstractBaseScraper

class IndeedScraper(AbstractBaseScraper):
    """Scraper adapter for Indeed México with Cloudflare TLS/HTTP2 bypass."""

    portal_name: str = "indeed"
    base_url: str = "https://mx.indeed.com"

    def parse_html(self, html_content: str) -> List[VacancyDTO]:
        soup = BeautifulSoup(html_content, "html.parser")
        vacancies: List[VacancyDTO] = []

        # 1. Attempt to parse high-fidelity structured JSON from script#mosaic-data
        mosaic_script = soup.find("script", id="mosaic-data")
        script_text = mosaic_script.get_text() if mosaic_script else ""
        if script_text:
            m = re.search(
                r"window\.mosaic\.providerData\[\"mosaic-provider-jobcards\"\]\s*=\s*(\{.+?\});",
                script_text,
                re.DOTALL,
            )
            if m:
                try:
                    data = json.loads(m.group(1))
                    results = data.get("metaData", {}).get("mosaicProviderJobCardsModel", {}).get("results", [])
                    if results:
                        for res in results:
                            title = self.sanitize_text(res.get("title", ""))
                            if not title:
                                continue
                            company_name = self.sanitize_text(res.get("company") or "Empresa Confidencial")
                            loc_text = res.get("formattedLocation", "México")
                            state = self.normalize_state(loc_text)
                            jk = res.get("jobkey", "")
                            direct_url = f"{self.base_url}/viewjob?jk={jk}" if jk else (res.get("link") or self.base_url)

                            # Salary extraction
                            sal_min = None
                            sal_max = None
                            sal_period = None
                            ext_sal = res.get("extractedSalary")
                            if isinstance(ext_sal, dict):
                                sal_min = ext_sal.get("min")
                                sal_max = ext_sal.get("max")
                                t_type = str(ext_sal.get("type", "")).lower()
                                if "month" in t_type:
                                    sal_period = "mensual"
                                elif "year" in t_type:
                                    sal_period = "anual"
                                elif "week" in t_type:
                                    sal_period = "semanal"

                            if sal_min is None and sal_max is None:
                                sal_snip = res.get("salarySnippet", {}).get("text")
                                if sal_snip:
                                    sal_min, sal_max, sal_period = self.parse_mexican_salary(sal_snip)

                            # Rich description snippet & requirements
                            snippet = self.sanitize_text(bleach.clean(res.get("snippet", ""), tags=[], strip=True))
                            reqs = [
                                r.get("label")
                                for r in res.get("jobCardRequirementsModel", {}).get("jobOnlyRequirements", [])
                                if r.get("label")
                            ]
                            types = res.get("jobTypes", [])
                            desc_parts = [snippet] if snippet else []
                            if reqs:
                                desc_parts.append("\n\nRequisitos clave:\n" + "\n".join(f"• {req}" for req in reqs))
                            if types:
                                desc_parts.append(f"\nTipo de empleo: {', '.join(types)}")
                            desc_text = "\n".join(desc_parts).strip() or title

                            # Publication timestamp
                            published_at = None
                            if res.get("pubDate"):
                                try:
                                    published_at = datetime.fromtimestamp(res["pubDate"] / 1000, tz=timezone.utc)
                                except Exception:
                                    pass
                            if not published_at and res.get("formattedRelativeTime"):
                                published_at = self.parse_mexican_relative_date(res["formattedRelativeTime"])

                            modality = self.infer_modality(title, f"{loc_text} {desc_text}")
                            sen_info = self.classify_seniority_fast(title, desc_text)
                            skills = self.extract_skills(f"{title} {desc_text} {' '.join(reqs)}")
                            fingerprint = self.generate_fingerprint(company_name, title, state, disambiguator=direct_url)

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
                                    location_city=self.sanitize_text(loc_text).split(",")[0] if "," in loc_text else None,
                                    location_state=state,
                                    modality=modality,
                                    seniority_level=sen_info["seniority_level"],
                                    years_required_min=sen_info["years_required_min"],
                                    is_real_first_job=sen_info["is_real_first_job"],
                                    audit_status=sen_info["audit_status"],
                                    reasoning=sen_info["reasoning"],
                                    has_discrepancy=sen_info["has_discrepancy"],
                                    salary_min=sal_min,
                                    salary_max=sal_max,
                                    salary_period=sal_period,
                                    currency="MXN",
                                    description=desc_text,
                                    skills=skills,
                                    published_at=published_at,
                                    external_links=[external_link],
                                )
                            )

                        if vacancies:
                            return vacancies
                except Exception:
                    pass

        # 2. DOM fallback for static HTML fixtures or desktop SERP
        cards = soup.select("div.job_seen_beacon, li.css-5lfssm, div[data-testid='jobListing']")
        for card in cards:
            link_tag = (
                card.select_one("h2.jobTitle a")
                or card.select_one("a.jcs-JobTitle")
                or card.select_one("a[data-jk]")
            )
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
            sen_info = self.classify_seniority_fast(title, desc_text)
            skills = self.extract_skills(f"{title} {desc_text}")

            fingerprint = self.generate_fingerprint(company_name, title, state, disambiguator=direct_url)

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

    async def fetch_full_description(self, direct_url: str) -> Optional[str]:
        """Attempts to fetch the full vacancy description body from Indeed or direct employer link."""
        jk = None
        if "jk=" in direct_url:
            jk = direct_url.split("jk=")[-1].split("&")[0]

        if jk:
            try:
                from curl_cffi.requests import AsyncSession
                async with AsyncSession(impersonate="chrome") as s:
                    r = await s.get(f"{self.base_url}/rpc/jobdescs?jks={jk}", timeout=6)
                    if r.status_code == 200:
                        data = r.json()
                        if jk in data and data[jk]:
                            return self.sanitize_text(
                                BeautifulSoup(data[jk], "html.parser").get_text("\n", strip=True)
                            )
            except Exception:
                pass

            try:
                from curl_cffi.requests import AsyncSession
                async with AsyncSession(impersonate="chrome") as s:
                    r = await s.get(f"{self.base_url}/rc/clk?jk={jk}", timeout=8)
                    if r.status_code == 200:
                        soup = BeautifulSoup(r.text, "html.parser")
                        desc = soup.select_one("#jobDescriptionText, div.jobsearch-jobDescriptionText, div[id*='jobDescription']")
                        if desc:
                            return self.sanitize_text(desc.get_text("\n", strip=True))
                        for d in soup.find_all(["div", "article", "section"]):
                            t = d.get_text(strip=True)
                            if len(t) > 500 and "security check" not in t.lower():
                                return self.sanitize_text(d.get_text("\n", strip=True))
            except Exception:
                pass
        return None

    async def search(
        self,
        query: str,
        location: Optional[str] = "México",
        modality: Optional[str] = "all",
        seniority: Optional[str] = "all",
        limit: int = 15,
    ) -> List[VacancyDTO]:
        loc = location or "México"
        url = f"{self.base_url}/jobs"
        params = {"q": query, "l": loc}

        # Attempt with curl_cffi impersonating modern Chrome to bypass Cloudflare bot challenge.
        # Includes a retry with short backoff to absorb cold-start connection/handshake drops.
        for attempt in range(2):
            try:
                from curl_cffi.requests import AsyncSession
                async with AsyncSession(impersonate="chrome") as s:
                    r = await s.get(url, params=params, timeout=10)
                    if r.status_code == 200:
                        vacancies = self.parse_html(r.text)
                        if vacancies:
                            vacancies = vacancies[:limit]
                            # Enrich with full descriptions via rpc/jobdescs
                            jks = []
                            for v in vacancies:
                                for link in v.external_links:
                                    if "jk=" in link.direct_url:
                                        jk_val = link.direct_url.split("jk=")[-1].split("&")[0]
                                        jks.append(jk_val)
                                        break
                            if jks:
                                try:
                                    rpc_url = f"{self.base_url}/rpc/jobdescs?jks={','.join(jks)}"
                                    rpc_resp = await s.get(rpc_url, timeout=8)
                                    if rpc_resp.status_code == 200:
                                        desc_map = rpc_resp.json()
                                        for v in vacancies:
                                            for link in v.external_links:
                                                if "jk=" in link.direct_url:
                                                    jk_val = link.direct_url.split("jk=")[-1].split("&")[0]
                                                    if jk_val in desc_map and desc_map[jk_val]:
                                                        full_desc = self.sanitize_text(
                                                            BeautifulSoup(desc_map[jk_val], "html.parser").get_text("\n", strip=True)
                                                        )
                                                        if len(full_desc) > len(v.description):
                                                            v.description = full_desc
                                                            v.skills = self.extract_skills(f"{v.title} {full_desc}")
                                                            up_sen = self.classify_seniority_fast(v.title, full_desc)
                                                            v.seniority_level = up_sen["seniority_level"]
                                                            v.years_required_min = up_sen["years_required_min"]
                                                            v.is_real_first_job = up_sen["is_real_first_job"]
                                                            v.audit_status = up_sen["audit_status"]
                                                            v.reasoning = up_sen["reasoning"]
                                                            v.has_discrepancy = up_sen["has_discrepancy"]
                                                    break
                                except Exception:
                                    pass
                            return vacancies
                    if attempt == 0:
                        await asyncio.sleep(0.5)
            except Exception:
                if attempt == 0:
                    await asyncio.sleep(0.5)

        # Fallback to standard fetch_html
        try:
            html = await self.fetch_html(url, params=params)
            vacancies = self.parse_html(html)
            return vacancies[:limit]
        except Exception:
            return []
