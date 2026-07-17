"""File upload endpoint tests."""

import pytest


@pytest.mark.asyncio
async def test_upload_text_file(auth_client):
    content = b"Hello ClearMate, this is a test file."
    r = await auth_client.post(
        "/api/v1/files",
        files={"file": ("test.txt", content, "text/plain")},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["original_name"] == "test.txt"
    assert data["mime_type"] == "text/plain"
    assert data["size_bytes"] == len(content)
    assert data["extracted_text"] == content.decode("utf-8")
    assert data["extraction_status"] == "done"
    assert "storage_path" not in data


@pytest.mark.asyncio
async def test_upload_rejects_unsupported_type(auth_client):
    content = b"\x00\x01\x02"
    r = await auth_client.post(
        "/api/v1/files",
        files={"file": ("test.xyz", content, "application/x-unknown")},
    )
    assert r.status_code == 415


@pytest.mark.asyncio
async def test_upload_rejects_spoofed_pdf(auth_client):
    r = await auth_client.post(
        "/api/v1/files",
        files={"file": ("fake.pdf", b"not really a pdf", "application/pdf")},
    )
    assert r.status_code == 415


@pytest.mark.asyncio
async def test_upload_rejects_empty_file(auth_client):
    r = await auth_client.post(
        "/api/v1/files",
        files={"file": ("empty.txt", b"", "text/plain")},
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_upload_sanitizes_original_filename(auth_client):
    r = await auth_client.post(
        "/api/v1/files",
        files={"file": ("../unsafe.txt", b"safe content", "text/plain")},
    )
    assert r.status_code == 201
    assert r.json()["original_name"] == "unsafe.txt"


@pytest.mark.asyncio
async def test_list_files(auth_client):
    # 上传 2 个文件
    await auth_client.post(
        "/api/v1/files",
        files={"file": ("a.txt", b"content a", "text/plain")},
    )
    await auth_client.post(
        "/api/v1/files",
        files={"file": ("b.txt", b"content b", "text/plain")},
    )

    r = await auth_client.get("/api/v1/files")
    assert r.status_code == 200
    assert len(r.json()) == 2


@pytest.mark.asyncio
async def test_get_file_detail(auth_client):
    r = await auth_client.post(
        "/api/v1/files",
        files={"file": ("detail.txt", b"detail content", "text/plain")},
    )
    file_id = r.json()["id"]

    r2 = await auth_client.get(f"/api/v1/files/{file_id}")
    assert r2.status_code == 200
    assert r2.json()["original_name"] == "detail.txt"


@pytest.mark.asyncio
async def test_delete_file(auth_client):
    r = await auth_client.post(
        "/api/v1/files",
        files={"file": ("del.txt", b"to be deleted", "text/plain")},
    )
    file_id = r.json()["id"]

    r2 = await auth_client.delete(f"/api/v1/files/{file_id}")
    assert r2.status_code == 204

    # 再次获取应该 404
    r3 = await auth_client.get(f"/api/v1/files/{file_id}")
    assert r3.status_code == 404
