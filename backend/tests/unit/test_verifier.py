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

@pytest.mark.asyncio
async def test_url_verifier_bot_challenge_active(monkeypatch):
    verifier = URLVerifier()

    async def mock_head(client, url, **kwargs):
        req = httpx.Request("HEAD", url)
        return httpx.Response(401, request=req)

    monkeypatch.setattr(httpx.AsyncClient, "head", mock_head)

    # 401 on indeed should be normalized as active human link
    res_indeed = await verifier.verify_single_url("https://mx.indeed.com/viewjob?jk=123")
    assert res_indeed.is_active is True
    assert res_indeed.status_code == 200

    # 401 on unknown non-portal domain is inactive
    res_other = await verifier.verify_single_url("https://otherdomain.com/secret")
    assert res_other.is_active is False
    assert res_other.status_code == 401

@pytest.mark.asyncio
async def test_url_verifier_occ_split_grid_active_and_expired(monkeypatch):
    verifier = URLVerifier()

    async def mock_get(client, url, **kwargs):
        req = httpx.Request("GET", url)
        if "/offer/21399716/" in url:
            return httpx.Response(200, json={"o": {"ld": "<p>Active</p>"}}, request=req)
        if "/offer/999999999/" in url:
            return httpx.Response(204, request=req)
        return httpx.Response(404, request=req)

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    res_active = await verifier.verify_single_url("https://www.occ.com.mx/empleos/?jobid=21399716")
    assert res_active.is_active is True
    assert res_active.status_code == 200

    res_expired = await verifier.verify_single_url("https://www.occ.com.mx/empleos/?jobid=999999999")
    assert res_expired.is_active is False
    assert res_expired.status_code == 404

@pytest.mark.asyncio
async def test_url_verifier_occ_legacy_oferta_403_checked_not_blindly_passed(monkeypatch):
    from unittest.mock import AsyncMock, MagicMock, patch
    verifier = URLVerifier()

    async def mock_head(client, url, **kwargs):
        req = httpx.Request("HEAD", url)
        return httpx.Response(403, request=req)

    monkeypatch.setattr(httpx.AsyncClient, "head", mock_head)

    async def fake_cffi_get(url, **kwargs):
        resp = MagicMock()
        resp.status_code = 404 if "21390143" in url else 200
        return resp

    mock_session = AsyncMock()
    mock_session.get.side_effect = fake_cffi_get
    mock_session_cls = MagicMock()
    mock_session_cls.return_value.__aenter__.return_value = mock_session

    with patch("curl_cffi.requests.AsyncSession", mock_session_cls):
        res_404 = await verifier.verify_single_url("https://www.occ.com.mx/empleo/oferta/21390143")
        assert res_404.is_active is False
        assert res_404.status_code == 404

        res_200 = await verifier.verify_single_url("https://www.occ.com.mx/empleo/oferta/21405808")
        assert res_200.is_active is True
        assert res_200.status_code == 200
