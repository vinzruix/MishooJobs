from mishoojobs.services.scam_detector import MexicanScamDetector

def test_detect_mlm_pyramid():
    detector = MexicanScamDetector()
    title = "Actividades sencillas de oficina ingresos altos"
    desc = "Gana de 3000 a 5000 semanales por actividades sencillas de oficina medio tiempo. Sé tu propio jefe, no pedimos experiencia."
    report = detector.assess_vacancy(title, desc)
    assert report.risk_level == "critical"
    assert "MLM_SCHEME" in report.risk_categories
    assert "[POSIBLE FRAUDE / PIRAMIDAL]" in report.badge_label

def test_detect_candidate_fee():
    detector = MexicanScamDetector()
    title = "Recepcionista urgente"
    desc = "Excelente ambiente laboral. Se requiere pago de uniforme y material de capacitación de 500 pesos."
    report = detector.assess_vacancy(title, desc)
    assert report.risk_level == "critical"
    assert "CANDIDATE_FEE" in report.risk_categories
    assert "[COBRO A CANDIDATO]" in report.badge_label

def test_detect_commission_only():
    detector = MexicanScamDetector()
    title = "Ejecutivo de ventas Jr"
    desc = "Ingresos ilimitados, 100% comisiones sin sueldo base."
    report = detector.assess_vacancy(title, desc)
    assert report.risk_level == "warning"
    assert "COMMISSION_ONLY" in report.risk_categories
    assert "[100% COMISIÓN]" in report.badge_label

def test_detect_foreign_visa_restriction():
    detector = MexicanScamDetector()
    title = "Junior Software Engineer - US Citizen only"
    desc = "Must be a US Citizen with security clearance. No foreign sponsorship."
    report = detector.assess_vacancy(title, desc)
    assert "FOREIGN_VISA_RESTRICTION" in report.risk_categories
    assert detector.is_foreign_visa_restricted(title, desc) is True

def test_safe_legitimate_posting():
    detector = MexicanScamDetector()
    title = "Desarrollador Python Junior"
    desc = "Buscamos programador junior con ganas de aprender FastAPI y PostgreSQL. Prestaciones superiores a las de la ley, sueldo $18,000 MXN mensuales."
    report = detector.assess_vacancy(title, desc)
    assert report.risk_level == "safe"
    assert len(report.risk_categories) == 0
    assert report.badge_label == "VERIFICADO SEGURO"

def test_scam_posting_disqualified_from_real_first_job():
    from mishoojobs.services.seniority_classifier import SeniorityClassifier
    detector = MexicanScamDetector()
    title = "Actividades sencillas de oficina ingresos altos"
    desc = "Gana de 3000 a 5000 semanales por actividades sencillas de oficina medio tiempo. Sé tu propio jefe, sin experiencia."
    scam_rep = detector.assess_vacancy(title, desc)
    is_scam = scam_rep.risk_level.value != "safe"
    classification = SeniorityClassifier.classify_fast(title, desc, is_scam=is_scam)
    assert classification["is_real_first_job"] is False
