import json
import pytest
from httpx import ASGITransport, AsyncClient
from mishoojobs.api.main import app

@pytest.mark.asyncio
async def test_sse_endpoint_stream():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/jobs/stream?query=Python+Junior&location=Guadalajara")
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")
        
        # Read raw stream lines
        text_data = response.text
        assert "event: portal_status" in text_data or "event: stream_end" in text_data

@pytest.mark.asyncio
async def test_sse_stream_count_mathematical_consistency():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/jobs/stream?query=Python+Junior&location=Guadalajara")
        assert response.status_code == 200
        
        events = response.text.split("\n\n")
        portal_counts = {}
        summary_data = None
        
        for raw in events:
            lines = raw.strip().split("\n")
            event_type = None
            data = None
            for line in lines:
                if line.startswith("event:"):
                    event_type = line[6:].strip()
                elif line.startswith("data:"):
                    data = json.loads(line[5:].strip())
            
            if event_type == "portal_status" and data:
                if data.get("status") == "completed":
                    portal_counts[data["portal"]] = data["count"]
            elif event_type == "deduplication_summary" and data:
                summary_data = data
        
        if summary_data and portal_counts:
            sum_portal_counts = sum(portal_counts.values())
            # Sum of portal status counts MUST match total_extracted
            assert sum_portal_counts == summary_data["total_extracted"]
            # Deduplication invariant MUST hold: total_extracted - duplicates_merged == unique_vacancies
            assert summary_data["total_extracted"] - summary_data["duplicates_merged"] == summary_data["unique_vacancies"]
            assert len(summary_data["vacancies"]) == summary_data["unique_vacancies"]
