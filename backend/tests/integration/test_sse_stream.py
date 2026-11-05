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
