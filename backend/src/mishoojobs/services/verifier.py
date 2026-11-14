import asyncio
import logging
from datetime import datetime, timezone
from typing import List, NamedTuple, Optional
import httpx

from mishoojobs.config import settings
from mishoojobs.schemas.job import VacancyDTO
from mishoojobs.services.scrapers.occ import OCC_OFFER_JSON_URL, extract_occ_offer_id

logger = logging.getLogger(__name__)

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

    async def _check_occ_offer_page_status(self, url: str) -> Optional[int]:
        """Resolves real HTTP status for legacy OCC /empleo/oferta/ URLs behind WAF."""
        try:
            from curl_cffi.requests import AsyncSession
            async with AsyncSession(impersonate="chrome") as session:
                resp = await session.get(url, timeout=self.timeout)
                return int(resp.status_code)
        except (ImportError, OSError, asyncio.TimeoutError, ValueError) as exc:
            logger.debug("OCC offer page status check failed for %s: %s", url, exc)
            return None

    async def _verify_occ_split_grid_url(
        self,
        client: httpx.AsyncClient,
        url: str,
        offer_id: str,
        now: datetime,
    ) -> VerificationResult:
        """Validates OCC split-grid ?jobid= links via OCC's offer detail JSON endpoint."""
        api_url = OCC_OFFER_JSON_URL.format(offer_id=offer_id)
        try:
            response = await client.get(api_url)
        except httpx.HTTPError:
            return VerificationResult(url=url, is_active=False, status_code=0, verified_at=now)

        if response.status_code == 200:
            return VerificationResult(url=url, is_active=True, status_code=200, verified_at=now)
        if response.status_code in (204, 404, 410):
            return VerificationResult(
                url=url,
                is_active=False,
                status_code=404 if response.status_code == 204 else response.status_code,
                verified_at=now,
            )
        if response.status_code in (401, 403, 429):
            return VerificationResult(url=url, is_active=True, status_code=200, verified_at=now)
        return VerificationResult(url=url, is_active=False, status_code=response.status_code, verified_at=now)

    async def verify_single_url(self, url: str) -> VerificationResult:
        """Performs HTTP HEAD with fallback to Range-GET on 405 and OCC offer liveness verification."""
        now = datetime.now(timezone.utc)
        async with self.semaphore:
            try:
                async with httpx.AsyncClient(
                    headers=self.headers,
                    timeout=self.timeout,
                    follow_redirects=True,
                ) as client:
                    if "occ.com.mx" in url and "jobid=" in url:
                        offer_id = extract_occ_offer_id(url)
                        if offer_id:
                            return await self._verify_occ_split_grid_url(client, url, offer_id, now)

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

                    # Legacy /empleo/oferta/ links often 404 behind Cloudflare's 403; verify real status instead of blind pass
                    if "occ.com.mx" in url and "/empleo/oferta/" in url and response.status_code in (401, 403, 429):
                        real_status = await self._check_occ_offer_page_status(url)
                        if real_status is None:
                            return VerificationResult(
                                url=url,
                                is_active=False,
                                status_code=response.status_code,
                                verified_at=now,
                            )
                        if real_status in (401, 403, 429):
                            return VerificationResult(url=url, is_active=True, status_code=200, verified_at=now)
                        return VerificationResult(
                            url=url,
                            is_active=(real_status < 400),
                            status_code=real_status,
                            verified_at=now,
                        )

                    # Cloudflare/Akamai bot challenges (401, 403, 429) on known job portals:
                    # These links are valid and active for human candidates clicking them in a browser.
                    is_bot_challenge = response.status_code in (401, 403, 429) and any(
                        domain in url for domain in ("occ.com.mx", "indeed.com", "computrabajo.com")
                    )

                    is_active = (response.status_code < 400) or is_bot_challenge
                    status_code = 200 if is_bot_challenge else response.status_code

                    return VerificationResult(
                        url=url,
                        is_active=is_active,
                        status_code=status_code,
                        verified_at=now,
                    )
            except (httpx.HTTPError, OSError, asyncio.TimeoutError, ValueError) as exc:
                logger.debug("URL verification error for %s: %s", url, exc)
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
