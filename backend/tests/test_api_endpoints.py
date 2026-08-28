"""
Integration tests for FastAPI endpoints (/api/verify, /api/collusion, /api/audit, /api/tenders, /api/registries).
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "GeM" in data["service"]


def test_debarment_registry_endpoint():
    # Test blacklisted PAN
    response = client.get("/api/registries/debarment/AABCE9999K")
    assert response.status_code == 200
    data = response.json()
    assert data["result"]["isDebarred"] is True
    assert "Rule 151" in data["result"]["reason"]

    # Test clean PAN
    response = client.get("/api/registries/debarment/AABCA1234F")
    assert response.status_code == 200
    data = response.json()
    assert data["result"]["isDebarred"] is False


def test_audit_endpoints():
    # 1. Reset
    r_reset = client.post("/api/audit/reset")
    assert r_reset.status_code == 200

    # 2. Get Audit Trail
    r_get = client.get("/api/audit")
    assert r_get.status_code == 200
    data = r_get.json()
    assert len(data["blocks"]) >= 1
    assert data["verification"]["isValid"] is True

    # 3. Simulate tamper
    r_tamper = client.post("/api/audit/simulate-tamper", json={
        "blockIndex": 0,
        "key": "version",
        "newValue": "HACKED-2.0"
    })
    assert r_tamper.status_code == 200
    t_data = r_tamper.json()
    assert t_data["verification"]["isValid"] is False
    assert t_data["verification"]["brokenBlockIndex"] == 0


def test_tenders_extract_clauses():
    response = client.post("/api/tenders/extract-clauses", json={
        "title": "Supply of Server Racks",
        "category": "GOODS",
        "description": "Procurement of 500 units of server racks under Make in India policy."
    })
    assert response.status_code == 200
    clauses = response.json()
    assert len(clauses) >= 4
    categories = [c["category"] for c in clauses]
    assert "DEBARMENT" in categories
    assert "MAKE_IN_INDIA" in categories
    assert "OEM_AUTH" in categories
