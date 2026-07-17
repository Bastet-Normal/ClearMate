"""文件文本提取器。

MVP 支持：
- 纯文本 (.txt)：直接读取
- PDF (.pdf)：用 pypdf 提取
- 图片 (.png/.jpg)：MVP 返回占位说明，OCR 后续接入

返回的文本会被截断到 50000 字符以内，与 ``File.extracted_text`` 列长度对齐。
"""
from __future__ import annotations

import asyncio
from pathlib import Path

_MAX_TEXT_LENGTH = 50000


async def extract_text(file_path: Path, mime_type: str) -> str:
    """根据 MIME 类型提取文本。失败抛异常，由调用方处理。"""
    if mime_type.startswith("text/"):
        return await asyncio.to_thread(_extract_text_file, file_path)
    if mime_type == "application/pdf":
        return await asyncio.to_thread(_extract_pdf, file_path)
    if mime_type.startswith("image/"):
        return _extract_image_placeholder(file_path)
    raise ValueError(f"暂不支持的文件类型: {mime_type}")


def _extract_text_file(file_path: Path) -> str:
    """读取纯文本文件。"""
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        return f.read(_MAX_TEXT_LENGTH)


def _extract_pdf(file_path: Path) -> str:
    """用 pypdf 提取 PDF 文本。"""
    from pypdf import PdfReader

    reader = PdfReader(str(file_path))
    chunks: list[str] = []
    total = 0
    for page in reader.pages:
        text = page.extract_text() or ""
        chunks.append(text)
        total += len(text)
        if total >= _MAX_TEXT_LENGTH:
            break
    return "\n\n".join(chunks)[:_MAX_TEXT_LENGTH]


def _extract_image_placeholder(file_path: Path) -> str:
    """图片文本提取占位：MVP 不做 OCR，返回占位说明。

    后续可接入 paddleocr / tencent ocr / 阿里 OCR。
    """
    return (
        f"[图片文件: {file_path.name}]\n"
        f"[MVP 阶段未启用 OCR，请改用文本描述或将文件转为 PDF 后上传]"
    )
