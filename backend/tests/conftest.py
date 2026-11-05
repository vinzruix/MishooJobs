import json
from pathlib import Path
import pytest

FIXTURES_DIR = Path(__file__).parent / "fixtures"

@pytest.fixture
def fixtures_path() -> Path:
    return FIXTURES_DIR

@pytest.fixture
def computrabajo_html() -> str:
    with open(FIXTURES_DIR / "computrabajo_raw.html", encoding="utf-8") as f:
        return f.read()

@pytest.fixture
def indeed_html() -> str:
    with open(FIXTURES_DIR / "indeed_raw.html", encoding="utf-8") as f:
        return f.read()

@pytest.fixture
def occ_html() -> str:
    with open(FIXTURES_DIR / "occ_raw.html", encoding="utf-8") as f:
        return f.read()

@pytest.fixture
def agy_eval_json() -> dict:
    with open(FIXTURES_DIR / "agy_eval_response.json", encoding="utf-8") as f:
        return json.load(f)
