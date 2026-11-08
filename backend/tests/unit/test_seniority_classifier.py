import json
from pathlib import Path
import pytest
from mishoojobs.schemas.job import AuditStatusEnum, SeniorityLevelEnum
from mishoojobs.services.seniority_classifier import SeniorityClassifier

FIXTURES_PATH = Path(__file__).parent.parent / "fixtures" / "seniority_fixtures.json"

def test_seniority_fixtures_all_categories():
    with open(FIXTURES_PATH) as f:
        fixtures = json.load(f)

    for category, items in fixtures.items():
        for item in items:
            res = SeniorityClassifier.classify_fast(item["title"], item["text"])
            assert res["seniority_level"].value == item["expected_seniority_level"], (
                f"Failed {item['title']}: got {res['seniority_level']} expected {item['expected_seniority_level']}"
            )
            assert res["years_required_min"] == item["expected_years_min"], (
                f"Failed {item['title']}: got years {res['years_required_min']} expected {item['expected_years_min']}"
            )
            assert res["is_real_first_job"] == item["expected_is_real_first_job"], (
                f"Failed {item['title']}: got real {res['is_real_first_job']} expected {item['expected_is_real_first_job']}"
            )
            assert res["has_discrepancy"] == item["expected_has_discrepancy"], (
                f"Failed {item['title']}: got disc {res['has_discrepancy']} expected {item['expected_has_discrepancy']}"
            )
            assert res["audit_status"] == AuditStatusEnum.PRELIMINARY

def test_authentic_first_job_zero_exp():
    res = SeniorityClassifier.classify_fast(
        title="Desarrollador Trainee Node.js",
        text="Empresa formal busca programador recién egresado. Sin experiencia previa. Capacitación pagada y prestaciones de ley por nómina.",
    )
    assert res["seniority_level"] == SeniorityLevelEnum.PRIMER_EMPLEO
    assert res["years_required_min"] == 0
    assert res["is_real_first_job"] is True
    assert res["has_discrepancy"] is False
    assert "primer empleo" in res["reasoning"].lower() or "0 años" in res["reasoning"].lower()

def test_unpaid_disqualifies_first_job():
    res = SeniorityClassifier.classify_fast(
        title="Desarrollador Web Trainee",
        text="Oportunidad para ganar experiencia. Puesto no remunerado, sin sueldo.",
    )
    assert res["seniority_level"] == SeniorityLevelEnum.PRIMER_EMPLEO
    assert res["years_required_min"] == 0
    assert res["is_real_first_job"] is False

def test_academic_classified_as_pasantia():
    res = SeniorityClassifier.classify_fast(
        title="Practicante de Sistemas",
        text="Para liberar residencias profesionales o servicio social. Convenio con la universidad.",
    )
    assert res["seniority_level"] == SeniorityLevelEnum.PASANTIA
    assert res["years_required_min"] == 0
    assert res["is_real_first_job"] is False

def test_fake_junior_discrepancy_mid():
    res = SeniorityClassifier.classify_fast(
        title="Junior Frontend React",
        text="Requisitos excluyentes: Mínimo 3 años de experiencia en desarrollo web con React y Next.js.",
    )
    assert res["seniority_level"] == SeniorityLevelEnum.MID
    assert res["years_required_min"] == 3
    assert res["has_discrepancy"] is True
    assert res["is_real_first_job"] is False
    assert "2+" in res["reasoning"]

def test_fake_junior_discrepancy_senior():
    res = SeniorityClassifier.classify_fast(
        title="Junior Developer",
        text="Buscamos talento junior. Requisitos: 5 años de experiencia liderando proyectos backend.",
    )
    assert res["seniority_level"] == SeniorityLevelEnum.SENIOR
    assert res["years_required_min"] == 5
    assert res["has_discrepancy"] is True
    assert res["is_real_first_job"] is False
    assert "5+" in res["reasoning"]

def test_ambiguous_defaults_to_junior_preliminary():
    res = SeniorityClassifier.classify_fast(
        title="Programador C#",
        text="Desarrollo de software interno. Manejo de Git y bases de datos relacionales.",
    )
    assert res["seniority_level"] == SeniorityLevelEnum.JUNIOR
    assert res["years_required_min"] == 0
    assert res["is_real_first_job"] is False
    assert res["audit_status"] == AuditStatusEnum.PRELIMINARY
    assert res["has_discrepancy"] is False
