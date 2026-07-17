"""Task endpoint tests."""
import pytest


@pytest.mark.asyncio
async def test_create_task_returns_201(auth_client):
    r = await auth_client.post("/api/v1/tasks", json={
        "title": "测试可疑短信",
        "task_type": "scam_check",
        "description": "收到一条中奖短信",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "测试可疑短信"
    assert data["task_type"] == "scam_check"
    assert data["status"] == "draft"
    assert data["description"] == "收到一条中奖短信"


@pytest.mark.asyncio
async def test_create_task_rejects_unknown_type(auth_client):
    r = await auth_client.post("/api/v1/tasks", json={
        "title": "未知类型",
        "task_type": "arbitrary_type",
    })
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_list_tasks_returns_paginated(auth_client):
    for i in range(3):
        await auth_client.post("/api/v1/tasks", json={
            "title": f"任务 {i}",
            "task_type": "general_life_issue",
        })
    r = await auth_client.get("/api/v1/tasks")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 3
    assert len(body["items"]) == 3


@pytest.mark.asyncio
async def test_get_task_detail(auth_client):
    r = await auth_client.post("/api/v1/tasks", json={
        "title": "详情测试",
        "task_type": "document_review",
    })
    task_id = r.json()["id"]
    r2 = await auth_client.get(f"/api/v1/tasks/{task_id}")
    assert r2.status_code == 200
    assert r2.json()["title"] == "详情测试"


@pytest.mark.asyncio
async def test_update_task_status_and_risk(auth_client):
    r = await auth_client.post("/api/v1/tasks", json={
        "title": "更新测试",
        "task_type": "scam_check",
    })
    task_id = r.json()["id"]
    r2 = await auth_client.patch(f"/api/v1/tasks/{task_id}", json={
        "status": "analyzing",
        "risk_level": "high",
    })
    assert r2.status_code == 200
    assert r2.json()["status"] == "analyzing"
    assert r2.json()["risk_level"] == "high"

    r3 = await auth_client.patch(f"/api/v1/tasks/{task_id}", json={"risk_level": None})
    assert r3.status_code == 200
    assert r3.json()["risk_level"] is None


@pytest.mark.asyncio
async def test_update_task_rejects_unknown_status(auth_client):
    r = await auth_client.post("/api/v1/tasks", json={
        "title": "状态校验",
        "task_type": "scam_check",
    })
    task_id = r.json()["id"]
    r2 = await auth_client.patch(f"/api/v1/tasks/{task_id}", json={"status": "unknown"})
    assert r2.status_code == 422


@pytest.mark.asyncio
async def test_delete_task_returns_204(auth_client):
    r = await auth_client.post("/api/v1/tasks", json={
        "title": "删除测试",
        "task_type": "general_life_issue",
    })
    task_id = r.json()["id"]
    r2 = await auth_client.delete(f"/api/v1/tasks/{task_id}")
    assert r2.status_code == 204
    # Confirm gone
    r3 = await auth_client.get(f"/api/v1/tasks/{task_id}")
    assert r3.status_code == 404


@pytest.mark.asyncio
async def test_unauthenticated_access_returns_401(client):
    r = await client.get("/api/v1/tasks")
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_user_cannot_see_other_users_task(client, auth_client):
    # Alice creates a task
    r = await auth_client.post("/api/v1/tasks", json={
        "title": "Alice 任务",
        "task_type": "scam_check",
    })
    task_id = r.json()["id"]
    # Bob registers and tries to read Alice's task
    bob_payload = {
        "email": "bob@example.com",
        "nickname": "Bob",
        "password": "secret123",
    }
    await client.post("/api/v1/auth/register", json=bob_payload)
    bob_login = await client.post("/api/v1/auth/login", json={
        "email": "bob@example.com",
        "password": "secret123",
    })
    bob_token = bob_login.json()["access_token"]
    r2 = await client.get(
        f"/api/v1/tasks/{task_id}",
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert r2.status_code == 404
