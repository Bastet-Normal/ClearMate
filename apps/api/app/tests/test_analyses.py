"""Analysis endpoint tests."""
import pytest


@pytest.mark.asyncio
async def test_create_analysis_returns_201(auth_client):
    # 先创建任务
    r = await auth_client.post("/api/v1/tasks", json={
        "title": "收到中奖短信，要我转账100元解冻费",
        "task_type": "scam_check",
        "description": "短信说中奖了，要我转账100元解冻费才能领奖",
    })
    assert r.status_code == 201
    task_id = r.json()["id"]

    # 触发分析
    r2 = await auth_client.post(f"/api/v1/tasks/{task_id}/analyses")
    assert r2.status_code == 201
    data = r2.json()
    assert data["task_id"] == task_id
    assert data["provider"] == "mock"
    assert data["risk_level"] in ("low", "medium", "high", "critical")
    assert isinstance(data["result_json"], dict)
    assert "summary" in data["result_json"]
    assert "risk_points" in data["result_json"]

    task = await auth_client.get(f"/api/v1/tasks/{task_id}")
    assert task.json()["status"] == "waiting_confirmation"


@pytest.mark.asyncio
async def test_analysis_updates_task_risk_level(auth_client):
    r = await auth_client.post("/api/v1/tasks", json={
        "title": "刷单兼职，先交保证金",
        "task_type": "scam_check",
        "description": "对方说刷单可以赚钱，但要先交500元保证金",
    })
    task_id = r.json()["id"]

    await auth_client.post(f"/api/v1/tasks/{task_id}/analyses")

    # 验证 task 的 risk_level 已更新
    r2 = await auth_client.get(f"/api/v1/tasks/{task_id}")
    assert r2.status_code == 200
    assert r2.json()["risk_level"] is not None


@pytest.mark.asyncio
async def test_list_analyses(auth_client):
    r = await auth_client.post("/api/v1/tasks", json={
        "title": "测试分析列表",
        "task_type": "scam_check",
    })
    task_id = r.json()["id"]

    # 还没分析时列表为空
    r1 = await auth_client.get(f"/api/v1/tasks/{task_id}/analyses")
    assert r1.status_code == 200
    assert r1.json() == []

    # 分析一次
    await auth_client.post(f"/api/v1/tasks/{task_id}/analyses")

    r2 = await auth_client.get(f"/api/v1/tasks/{task_id}/analyses")
    assert r2.status_code == 200
    assert len(r2.json()) == 1


@pytest.mark.asyncio
async def test_get_latest_analysis(auth_client):
    r = await auth_client.post("/api/v1/tasks", json={
        "title": "测试最新分析",
        "task_type": "scam_check",
    })
    task_id = r.json()["id"]

    # 还没分析时 404
    r1 = await auth_client.get(f"/api/v1/tasks/{task_id}/analyses/latest")
    assert r1.status_code == 404

    # 分析一次
    await auth_client.post(f"/api/v1/tasks/{task_id}/analyses")

    r2 = await auth_client.get(f"/api/v1/tasks/{task_id}/analyses/latest")
    assert r2.status_code == 200
    assert r2.json()["task_id"] == task_id


@pytest.mark.asyncio
async def test_analysis_nonexistent_task_returns_404(auth_client):
    r = await auth_client.post("/api/v1/tasks/99999/analyses")
    assert r.status_code == 404
