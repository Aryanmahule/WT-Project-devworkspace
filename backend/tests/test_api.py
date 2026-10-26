import pytest
import json
from app import create_app
from app.models import db, User, Organization, Project

@pytest.fixture
def client():
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        # Seed test org and admin user
        org = Organization(name="Test Corp", slug="test-corp")
        db.session.add(org)
        db.session.flush()

        admin = User(
            organization_id=org.id,
            username="testadmin",
            email="admin@test.com",
            full_name="Test Administrator",
            role="platform_admin",
            status="active"
        )
        admin.set_password("SecurePassword123")
        db.session.add(admin)
        db.session.commit()

        yield app.test_client()
        db.drop_all()

def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"

def test_login_and_me(client):
    res = client.post("/api/auth/login", json={
        "email_or_username": "admin@test.com",
        "password": "SecurePassword123"
    })
    assert res.status_code == 200
    token = res.get_json()["token"]
    assert token is not None

    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.get_json()["user"]["username"] == "testadmin"

def test_project_and_task_lifecycle(client):
    # Login
    res = client.post("/api/auth/login", json={
        "email_or_username": "admin@test.com",
        "password": "SecurePassword123"
    })
    token = res.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create project
    proj_res = client.post("/api/projects", headers=headers, json={
        "name": "Integration Test Project",
        "key": "ITEST",
        "description": "Project for automated testing",
        "priority": "high"
    })
    assert proj_res.status_code == 201
    proj_id = proj_res.get_json()["project"]["id"]

    # Create task
    task_res = client.post("/api/tasks", headers=headers, json={
        "project_id": proj_id,
        "title": "Write unit tests",
        "status": "todo",
        "priority": "medium"
    })
    assert task_res.status_code == 201
    task_id = task_res.get_json()["task"]["id"]

    # Update status to in_progress
    status_res = client.put(f"/api/tasks/{task_id}/status", headers=headers, json={
        "status": "in_progress"
    })
    assert status_res.status_code == 200
    assert status_res.get_json()["task"]["status"] == "in_progress"

    # Dashboard analytics metrics
    dash_res = client.get("/api/analytics/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.get_json()
    assert dash_data["metrics"]["total_projects"] >= 1
    assert dash_data["metrics"]["total_tasks"] >= 1
