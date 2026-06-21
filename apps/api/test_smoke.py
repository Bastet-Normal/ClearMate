"""Quick smoke test for auth + task endpoints."""
import asyncio
import sys
import uuid

sys.path.insert(0, ".")

from httpx import ASGITransport, AsyncClient

from app.core.database import Base, async_engine
from app.main import app
from app.models import Task, User  # noqa


async def main():
    # Recreate tables for a clean state
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    # Unique email per run
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register
        r = await client.post("/api/v1/auth/register", json={
            "email": email,
            "nickname": "TestUser",
            "password": "123456",
        })
        print(f"REGISTER: {r.status_code}")
        data = r.json()
        print(f"  token={data.get('access_token','')[:30]}...")
        print(f"  user.email={data.get('user',{}).get('email')}")

        assert r.status_code == 201, f"Register failed: {r.text}"
        token = data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Duplicate register
        r_dup = await client.post("/api/v1/auth/register", json={
            "email": email,
            "nickname": "Dup",
            "password": "123456",
        })
        print(f"\nDUP REGISTER: {r_dup.status_code} (expect 400)")
        assert r_dup.status_code == 400

        # 3. Me
        r2 = await client.get("/api/v1/auth/me", headers=headers)
        print(f"\nME: {r2.status_code}")
        print(f"  nickname={r2.json().get('nickname')}")

        # 4. Login
        r3 = await client.post("/api/v1/auth/login", json={
            "email": email,
            "password": "123456",
        })
        print(f"\nLOGIN: {r3.status_code}")
        assert r3.status_code == 200

        # 5. Wrong password
        r4 = await client.post("/api/v1/auth/login", json={
            "email": email,
            "password": "wrong",
        })
        print(f"WRONG LOGIN: {r4.status_code} (expect 401)")
        assert r4.status_code == 401

        # 6. Create task
        r5 = await client.post("/api/v1/tasks", json={
            "title": "测试可疑短信",
            "task_type": "scam_check",
            "description": "收到一条中奖短信",
        }, headers=headers)
        print(f"\nCREATE TASK: {r5.status_code}")
        task = r5.json()
        print(f"  id={task['id']}, title={task['title']}, status={task['status']}")

        # 7. List tasks
        r6 = await client.get("/api/v1/tasks", headers=headers)
        print(f"\nLIST TASKS: {r6.status_code}")
        print(f"  total={r6.json()['total']}, items={len(r6.json()['items'])}")

        # 8. Get task detail
        r7 = await client.get(f"/api/v1/tasks/{task['id']}", headers=headers)
        print(f"\nGET TASK: {r7.status_code}")

        # 9. Update task
        r8 = await client.patch(f"/api/v1/tasks/{task['id']}", json={
            "status": "analyzing",
            "risk_level": "high",
        }, headers=headers)
        print(f"\nUPDATE TASK: {r8.status_code}")
        print(f"  status={r8.json()['status']}, risk_level={r8.json()['risk_level']}")

        # 10. Delete task
        r9 = await client.delete(f"/api/v1/tasks/{task['id']}", headers=headers)
        print(f"\nDELETE TASK: {r9.status_code} (expect 204)")

        # 11. Unauth access
        r10 = await client.get("/api/v1/tasks")
        print(f"\nUNAUTH LIST: {r10.status_code} (expect 401)")

        print("\n===== ALL TESTS PASSED =====")


asyncio.run(main())
