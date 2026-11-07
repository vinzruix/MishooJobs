import asyncio
import json
import time
from typing import AsyncGenerator, List
from sqlalchemy.dialects.postgresql import insert

from mishoojobs.database import async_session_factory
from mishoojobs.models.scam import ScamAssessment
from mishoojobs.models.vacancy import ExternalJobLink, JobVacancy
from mishoojobs.schemas.job import (
    PortalName,
    PortalScraperStatus,
    PortalStatusEvent,
    SearchParams,
    VacancyDTO,
)
from mishoojobs.services.deduplicator import CrossPortalDeduplicator
from mishoojobs.services.scam_detector import MexicanScamDetector
from mishoojobs.services.scrapers.computrabajo import ComputrabajoScraper
from mishoojobs.services.scrapers.indeed import IndeedScraper
from mishoojobs.services.scrapers.occ import OCCScraper
from mishoojobs.services.verifier import URLVerifier

def format_sse(event: str, data: dict) -> str:
    """Formats payload into SSE wire specification."""
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False, default=str)}\n\n"

async def persist_vacancies_safe(vacancies: List[VacancyDTO]) -> None:
    """Persists discovered active vacancies and external links to PostgreSQL using upsert."""
    if not vacancies:
        return
    try:
        async with async_session_factory() as session:
            for v in vacancies:
                stmt = (
                    insert(JobVacancy)
                    .values(
                        fingerprint=v.fingerprint,
                        title=v.title,
                        company_name=v.company_name,
                        location_city=v.location_city,
                        location_state=v.location_state,
                        modality=v.modality,
                        category=v.category,
                        salary_min=v.salary_min,
                        salary_max=v.salary_max,
                        salary_period=v.salary_period.value if v.salary_period else None,
                        currency="MXN",
                        description_clean=v.description,
                        skills_extracted=v.skills,
                        published_at=v.published_at,
                        is_verified_active=True,
                    )
                    .on_conflict_do_update(
                        index_elements=["fingerprint"],
                        set_={
                            "salary_min": v.salary_min,
                            "salary_max": v.salary_max,
                            "skills_extracted": v.skills,
                            "published_at": v.published_at,
                        },
                    )
                    .returning(JobVacancy.id)
                )
                res = await session.execute(stmt)
                vac_id = res.scalar_one_or_none()

                if vac_id:
                    if v.scam_report:
                        scam_stmt = insert(ScamAssessment).values(
                            vacancy_fingerprint=v.fingerprint,
                            risk_level=v.scam_report.risk_level.value,
                            risk_categories=v.scam_report.risk_categories,
                            matched_indicators=v.scam_report.matched_indicators,
                            badge_label=v.scam_report.badge_label,
                            explanation=v.scam_report.explanation,
                        )
                        await session.execute(scam_stmt)

                    for link in v.external_links:
                        link_stmt = insert(ExternalJobLink).values(
                            vacancy_id=vac_id,
                            portal_name=link.portal_name.value,
                            direct_url=link.direct_url,
                            http_status_code=link.http_status_code or 200,
                            is_active=link.is_active,
                        )
                        await session.execute(link_stmt)
            await session.commit()
    except Exception:
        # DB persistence is non-blocking to live search delivery
        pass

async def job_search_stream_generator(params: SearchParams) -> AsyncGenerator[str, None]:
    """Concurrent multi-portal streaming generator yielding SSE events in real-time."""
    start_time = time.monotonic()
    scrapers = [
        (PortalName.COMPUTRABAJO, ComputrabajoScraper()),
        (PortalName.INDEED, IndeedScraper()),
        (PortalName.OCC, OCCScraper()),
    ]

    verifier = URLVerifier()
    deduplicator = CrossPortalDeduplicator()
    all_extracted_vacancies: List[VacancyDTO] = []

    # 1. Emit initial "searching" events for all portals immediately
    for portal_name, _ in scrapers:
        yield format_sse(
            "portal_status",
            PortalStatusEvent(
                portal=portal_name,
                status=PortalScraperStatus.SEARCHING,
                count=0,
                message=f"{portal_name.value.capitalize()}: Consultando en tiempo real...",
                duration_ms=0,
            ).model_dump(mode="json"),
        )

    scam_detector = MexicanScamDetector()

    # 2. Worker function for each portal
    async def run_portal(p_name: PortalName, scraper) -> tuple[PortalName, List[VacancyDTO], int, str]:
        p_start = time.monotonic()
        try:
            raw_vacancies = await scraper.search(
                query=params.query,
                location=params.location,
                modality=params.modality.value if params.modality else "all",
                category=params.category.value if params.category else "all",
                limit=params.limit_per_portal,
            )

            # Filter out listings with foreign visa restrictions (FR-015, SC-003)
            mexican_filtered = [
                v for v in raw_vacancies
                if not scam_detector.is_foreign_visa_restricted(v.title, v.description)
            ]

            # In-flight URL verification (FR-002)
            verified = await verifier.verify_vacancies(mexican_filtered)

            # Predatory and scam assessment (FR-012, FR-013)
            for v in verified:
                v.scam_report = scam_detector.assess_vacancy(v.title, v.description)

            p_duration = int((time.monotonic() - p_start) * 1000)
            return (p_name, verified, p_duration, "completed")
        except asyncio.TimeoutError:
            p_duration = int((time.monotonic() - p_start) * 1000)
            return (p_name, [], p_duration, "timeout")
        except Exception:
            p_duration = int((time.monotonic() - p_start) * 1000)
            return (p_name, [], p_duration, "error")

    # Run scrapers as tasks completed in arrival order (progressive delivery)
    tasks = [asyncio.create_task(run_portal(p_name, sc)) for p_name, sc in scrapers]

    for completed_task in asyncio.as_completed(tasks):
        portal_name, verified_vacs, duration_ms, status_str = await completed_task

        if status_str == "completed":
            p_status = PortalScraperStatus.COMPLETED
            msg = f"{portal_name.value.capitalize()}: {len(verified_vacs)} vacantes verificadas"
        elif status_str == "timeout":
            p_status = PortalScraperStatus.TIMEOUT
            msg = f"{portal_name.value.capitalize()}: Tiempo de espera agotado"
        else:
            p_status = PortalScraperStatus.ERROR
            msg = f"{portal_name.value.capitalize()}: No disponible temporalmente"

        # Emit portal status update
        yield format_sse(
            "portal_status",
            PortalStatusEvent(
                portal=portal_name,
                status=p_status,
                count=len(verified_vacs),
                message=msg,
                duration_ms=duration_ms,
            ).model_dump(mode="json"),
        )

        # Emit batch if vacancies found
        if verified_vacs:
            all_extracted_vacancies.extend(verified_vacs)
            yield format_sse(
                "vacancy_batch",
                {
                    "portal": portal_name.value,
                    "vacancies": [v.model_dump(by_alias=True, mode="json") for v in verified_vacs],
                },
            )

    # 3. Cross-portal Deduplication
    unique_vacancies, summary = deduplicator.deduplicate_batch(all_extracted_vacancies)
    yield format_sse("deduplication_summary", summary.model_dump(mode="json"))

    # 4. Async persistence in background
    asyncio.create_task(persist_vacancies_safe(unique_vacancies))

    # 5. Emit terminal stream_end event
    total_duration_ms = int((time.monotonic() - start_time) * 1000)
    final_status = "complete" if unique_vacancies else "failed" if not all_extracted_vacancies else "partial"
    yield format_sse(
        "stream_end",
        {
            "status": final_status,
            "total_vacancies": len(unique_vacancies),
            "total_duration_ms": total_duration_ms,
        },
    )
