"""Auth endpoint tests."""
import pytest


@pytest.mark.asyncio
async def test_register_returns_token_and_user(client):
    r = await client.post("/api/v1/auth/register", json={
        "email": "alice@example.com",
        "nickname": "Alice",
        "password": "secret123",
    })
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    user = data["user"]
    assert user["email"] == "alice@example.com"
    assert user["nickname"] == "Alice"
    assert "password" not in user
    assert "hashed_password" not in user


@pytest.mark.asyncio
async def test_register_duplicate_email_returns_400(client):
    payload = {"email": "dup@example.com", "nickname": "Dup", "password": "secret123"}
    r1 = await client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201
    r2 = await client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 400


@pytest.mark.asyncio
async def test_email_identity_is_case_insensitive(client):
    payload = {"email": "Case@Test.Example", "nickname": "Case", "password": "secret123"}
    r1 = await client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201
    assert r1.json()["user"]["email"] == "case@test.example"

    r2 = await client.post("/api/v1/auth/login", json={
        "email": "CASE@test.example",
        "password": "secret123",
    })
    assert r2.status_code == 200


@pytest.mark.asyncio
async def test_register_short_password_returns_422(client):
    r = await client.post("/api/v1/auth/register", json={
        "email": "short@example.com",
        "nickname": "Short",
        "password": "12345",
    })
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_login_returns_token(client):
    await client.post("/api/v1/auth/register", json={
        "email": "login@example.com",
        "nickname": "Login",
        "password": "secret123",
    })
    r = await client.post("/api/v1/auth/login", json={
        "email": "login@example.com",
        "password": "secret123",
    })
    assert r.status_code == 200
    assert "access_token" in r.json()


@pytest.mark.asyncio
async def test_login_wrong_password_returns_401(client):
    await client.post("/api/v1/auth/register", json={
        "email": "wrong@example.com",
        "nickname": "Wrong",
        "password": "secret123",
    })
    r = await client.post("/api/v1/auth/login", json={
        "email": "wrong@example.com",
        "password": "wrong-password",
    })
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_me_without_token_returns_401(client):
    r = await client.get("/api/v1/auth/me")
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_me_with_token_returns_user(auth_client):
    r = await auth_client.get("/api/v1/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == "alice@example.com"
