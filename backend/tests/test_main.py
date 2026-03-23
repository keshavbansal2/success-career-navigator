"""
Tests for the Career Navigator API.

Run with:
    cd backend
    pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient

# Patch out the Anthropic API key so tests always use the local engine
import os
os.environ.setdefault("ANTHROPIC_API_KEY", "")

from main import app  # noqa: E402 – import after env patch

client = TestClient(app)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

def test_health_check():
    """Health endpoint returns 200 and status ok."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


# ---------------------------------------------------------------------------
# Happy-path tests
# ---------------------------------------------------------------------------

def test_analyze_valid_profile_returns_expected_structure():
    """Happy path: a complete profile for a known role returns all required fields."""
    payload = {
        "resume_text": (
            "Python developer with 3 years of experience. "
            "Skills: Python, pandas, scikit-learn, SQL, matplotlib, "
            "machine learning, data analysis, git."
        ),
        "target_role": "Data Scientist",
    }
    response = client.post("/api/analyze", json=payload)

    assert response.status_code == 200
    data = response.json()

    # Required top-level keys
    assert "readiness_score" in data
    assert "current_skills" in data
    assert "required_skills" in data
    assert "skill_gaps" in data
    assert "roadmap" in data
    assert "summary" in data

    # Score is a valid integer in [0, 100]
    score = data["readiness_score"]
    assert isinstance(score, int)
    assert 0 <= score <= 100

    # A profile with several matching skills should score above 30
    assert score > 30, f"Expected score > 30 for a partial Data Scientist match, got {score}"

    # Required skills structure
    req = data["required_skills"]
    assert "critical" in req
    assert "important" in req
    assert "nice_to_have" in req

    # Roadmap is a non-empty list
    assert isinstance(data["roadmap"], list)
    assert len(data["roadmap"]) > 0

    # Summary is a non-empty string
    assert isinstance(data["summary"], str)
    assert len(data["summary"]) > 10


def test_analyze_strong_profile_scores_high():
    """Happy path: a profile that matches most critical skills scores ≥ 60."""
    payload = {
        "resume_text": (
            "Senior Cloud Engineer with 5 years experience. "
            "Expert in AWS, GCP, Azure, Kubernetes, Terraform, Docker, "
            "CI/CD with GitHub Actions, Jenkins, Linux, Bash scripting, "
            "Prometheus, Grafana, networking, IAM, security, VPC, DNS."
        ),
        "target_role": "Cloud Engineer",
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["readiness_score"] >= 60


def test_interview_questions_happy_path():
    """Happy path: interview endpoint returns a list of questions."""
    payload = {
        "resume_text": "Backend developer with Python, FastAPI, PostgreSQL, Docker, Redis, git.",
        "target_role": "Backend Developer",
        "skill_gaps": ["Message Queues", "Caching"],
    }
    response = client.post("/api/interview-questions", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "questions" in data
    questions = data["questions"]
    assert isinstance(questions, list)
    assert len(questions) > 0

    # Each question must have the required fields
    for q in questions:
        assert "category" in q
        assert "difficulty" in q
        assert "question" in q
        assert "hint" in q
        assert q["difficulty"] in ("Easy", "Medium", "Hard")


# ---------------------------------------------------------------------------
# Edge-case / validation tests
# ---------------------------------------------------------------------------

def test_analyze_empty_resume_returns_422():
    """Edge case: empty resume text should be rejected with 422."""
    payload = {
        "resume_text": "",
        "target_role": "Frontend Developer",
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422
    body = response.json()
    # FastAPI wraps Pydantic errors under "detail"
    assert "detail" in body


def test_analyze_whitespace_only_resume_returns_422():
    """Edge case: whitespace-only resume is too short and must be rejected."""
    payload = {
        "resume_text": "   ",
        "target_role": "ML Engineer",
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422


def test_analyze_empty_target_role_returns_422():
    """Edge case: empty target role should be rejected with 422."""
    payload = {
        "resume_text": "I have Python and machine learning skills.",
        "target_role": "",
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422


def test_analyze_whitespace_target_role_returns_422():
    """Edge case: whitespace-only target role should be rejected."""
    payload = {
        "resume_text": "Experienced DevOps engineer with Kubernetes and Terraform.",
        "target_role": "   ",
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422


def test_analyze_unknown_role_returns_valid_response():
    """Edge case: an unrecognised role should still return a valid response (generic fallback)."""
    payload = {
        "resume_text": "I have communication, leadership, and project management skills.",
        "target_role": "Quantum Archaeologist",
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "readiness_score" in data
    assert "roadmap" in data


def test_analyze_very_long_target_role_returns_422():
    """Edge case: target role exceeding 100 characters should be rejected."""
    payload = {
        "resume_text": "I have Python and SQL skills.",
        "target_role": "A" * 101,
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422


def test_interview_empty_resume_returns_422():
    """Edge case: empty resume for interview endpoint returns 422."""
    payload = {
        "resume_text": "",
        "target_role": "Data Engineer",
    }
    response = client.post("/api/interview-questions", json=payload)
    assert response.status_code == 422


def test_interview_empty_role_returns_422():
    """Edge case: empty role for interview endpoint returns 422."""
    payload = {
        "resume_text": "Python and SQL developer with ETL pipeline experience.",
        "target_role": "",
    }
    response = client.post("/api/interview-questions", json=payload)
    assert response.status_code == 422
