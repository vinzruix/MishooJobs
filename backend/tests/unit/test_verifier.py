import pytest
import httpx
from mishoojobs.services.verifier import URLVerifier

@pytest.mark.asyncio
async def test_url_verifier_success(monkeypatch):
    verifier = URLVerifier()

    async def mock_head(client, url, **kwargs):
        req = httpx.Request("HEAD", url)
        return httpx.Response(200, request=req)

    monkeypatch.setattr(httpx.AsyncClient, "head", mock_head)
    
    result = await verifier.verify_single_url("https://example.com/job/123")
    assert result.is_active is True
    assert result.status_code == 200

@pytest.mark.asyncio
async def test_url_verifier_404_inactive(monkeypatch):
    verifier = URLVerifier()

    async def mock_head(client, url, **kwargs):
        req = httpx.Request("HEAD", url)
        return httpx.Response(404, request=req)

    monkeypatch.setattr(httpx.AsyncClient, "head", mock_head)
    
    result = await verifier.verify_single_url("https://example.com/job/dead")
    assert result.is_active is False
    assert result.status_code == 404

@pytest.mark.asyncio
async def test_url_verifier_405_range_get_fallback(monkeypatch):
    verifier = URLVerifier()

    async def mock_head(client, url, **kwargs):
        req = httpx.Request("HEAD", url)
        return httpx.Response(405, request=req)

    async def mock_get(client, url, **kwargs):
        req = httpx.Request("GET", url)
        return httpx.Response(206, request=req)

    monkeypatch.setattr(httpx.AsyncClient, "head", mock_head)
    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    result = await verifier.verify_single_url("https://example.com/job/nohead")
    assert result.is_active is True
    assert result.status_code == 206
