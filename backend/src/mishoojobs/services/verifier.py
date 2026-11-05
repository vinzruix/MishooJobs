import asyncio
from datetime import datetime, timezone
from typing import List, NamedTuple
import httpx

from mishoojobs.config import settings
from mishoojobs.schemas.job import VacancyDTO

class VerificationResult(NamedTuple):
    url: str
    is_active: bool
    status_code: int
    verified_at: datetime

class URLVerifier:
    """Asynchronous in-flight HTTP HEAD verification service with semaphore concurrency and fallback."""

    def __init__(self, concurrency: int = 15, timeout: float = 2.5):
        self.semaphore = asyncio.Semaphore(concurrency)
        self.timeout = timeout
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "*/*",
        }

    async def verify_single_url(self, url: str) -> VerificationResult:
        """Performs HTTP HEAD with fallback to Range-GET on 405 Method Not Allowed."""
        now = datetime.now(timezone.utc)
        async with self.semaphore:
            try:
                async with httpx.AsyncClient(
                    headers=self.headers,
                    timeout=self.timeout,
                    follow_redirects=True,
                ) as client:
                    try:
                        response = await client.head(url)
                    except httpx.HTTPError:
                        return VerificationResult(url=url, is_active=False, status_code=0, verified_at=now)

                    # Some servers reject HEAD with 405 Method Not Allowed; fallback to single-byte Range GET
                    if response.status_code == 405:
                        range_headers = {**self.headers, "Range": "bytes=0-0"}
                        try:
                            response = await client.get(url, headers=range_headers)
                        except httpx.HTTPError:
                            return VerificationResult(url=url, is_active=False, status_code=405, verified_at=now)

                    is_active = response.status_code < 400
                    return VerificationResult(
                        url=url,
                        is_active=is_active,
                        status_code=response.status_code,
                        verified_at=now,
                    )
            except Exception:
                return VerificationResult(url=url, is_active=False, status_code=0, verified_at=now)

    async def verify_vacancies(self, vacancies: List[VacancyDTO]) -> List[VacancyDTO]:
        """Verifies external links for all vacancies concurrently and filters out dead listings."""
        if not vacancies:
            return []

        # Gather all links
        tasks = []
        for vacancy in vacancies:
            for link in vacancy.external_links:
                tasks.append(self.verify_single_url(link.direct_url))

        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Build lookup table
        result_map = {}
        for res in results:
            if isinstance(res, VerificationResult):
                result_map[res.url] = res

        verified_vacancies: List[VacancyDTO] = []
        for vacancy in vacancies:
            active_links = []
            for link in vacancy.external_links:
                ver = result_map.get(link.direct_url)
                if ver and ver.is_active:
                    link.is_active = True
                    link.http_status_code = ver.status_code
                    link.verified_at = ver.verified_at
                    active_links.append(link)

            # Only retain vacancies with at least one active functional direct link (FR-002)
            if active_links:
                vacancy.external_links = active_links
                vacancy.last_verified_at = datetime.now(timezone.utc)
                verified_vacancies.append(vacancy)

        return verified_vacancies
