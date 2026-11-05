from mishoojobs.services.heuristic_scorer import HeuristicCompatibilityScorer

def test_heuristic_scorer_perfect_match():
    scorer = HeuristicCompatibilityScorer()
    candidate_skills = ["Python", "FastAPI", "PostgreSQL", "Git"]
    job_skills = ["Python", "FastAPI", "Git"]
    score, matched, missing = scorer.calculate_score(candidate_skills, job_skills)
    assert score >= 90
    assert "Python" in matched
    assert "FastAPI" in matched
    assert len(missing) == 0

def test_heuristic_scorer_partial_match():
    scorer = HeuristicCompatibilityScorer()
    candidate_skills = ["Python", "Git"]
    job_skills = ["Python", "FastAPI", "Docker", "Git"]
    score, matched, missing = scorer.calculate_score(candidate_skills, job_skills)
    assert 40 <= score <= 70
    assert "Python" in matched
    assert "Git" in matched
    assert "Docker" in missing or "FastAPI" in missing

def test_heuristic_scorer_empty_overlap():
    scorer = HeuristicCompatibilityScorer()
    candidate_skills = ["Java", "Spring Boot"]
    job_skills = ["Python", "Django"]
    score, matched, missing = scorer.calculate_score(candidate_skills, job_skills)
    assert score == 0
    assert len(matched) == 0
    assert len(missing) == 2
