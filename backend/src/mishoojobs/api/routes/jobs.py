from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from mishoojobs.api.sse import job_search_stream_generator
from mishoojobs.schemas.job import CategoryEnum, ModalityEnum, SearchParams

router = APIRouter(prefix="", tags=["Jobs"])

@router.get("/jobs/stream")
async def stream_live_jobs(
    query: str = Query(..., min_length=2, max_length=100, description="Role keywords"),
    location: str = Query(default="México", description="Target location in Mexico"),
    modality: ModalityEnum = Query(default=ModalityEnum.ALL),
    category: CategoryEnum = Query(default=CategoryEnum.ALL),
    limit_per_portal: int = Query(default=15, ge=1, le=15),
):
    """Progressive SSE streaming endpoint executing concurrent Mexican portal queries with in-flight link verification."""
    params = SearchParams(
        query=query,
        location=location,
        modality=modality,
        category=category,
        limit_per_portal=limit_per_portal,
    )
    return StreamingResponse(
        job_search_stream_generator(params),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
