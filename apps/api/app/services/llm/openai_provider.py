"""OpenAI-compatible LLM Provider。

支持的接口：
- OpenAI 官方 API（``OPENAI_API_BASE`` 留空）
- 任何兼容 OpenAI Chat Completions 协议的代理
  （智谱 GLM、阿里通义、DeepSeek 等多数厂商提供 OpenAI 兼容端点）

使用：
- 设置 ``OPENAI_API_KEY``
- 可选设置 ``OPENAI_API_BASE`` 和 ``OPENAI_MODEL``
- ``LLM_PROVIDER=openai`` 切换到此 provider
"""
from __future__ import annotations

from typing import Any

from openai import AsyncOpenAI

from .base import (
    LLMMessage,
    LLMProvider,
    LLMResponse,
    parse_analysis_result,
)


class OpenAIProvider(LLMProvider):
    """OpenAI-compatible provider。"""

    name = "openai"

    def __init__(
        self,
        api_key: str,
        *,
        api_base: str | None = None,
        default_model: str = "gpt-4o-mini",
        timeout: float = 60.0,
        max_retries: int = 2,
    ):
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=api_base,
            timeout=timeout,
            max_retries=max_retries,
        )
        self.default_model = default_model

    async def chat(
        self,
        messages: list[LLMMessage],
        *,
        model: str | None = None,
        temperature: float = 0.3,
        response_format: dict | None = None,
    ) -> LLMResponse:
        kwargs: dict[str, Any] = {
            "model": model or self.default_model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": temperature,
        }
        if response_format is not None:
            kwargs["response_format"] = response_format

        resp = await self.client.chat.completions.create(**kwargs)

        choice = resp.choices[0]
        content = choice.message.content or ""
        parsed = parse_analysis_result(content)

        usage = {}
        if resp.usage:
            usage = {
                "prompt_tokens": resp.usage.prompt_tokens,
                "completion_tokens": resp.usage.completion_tokens,
                "total_tokens": resp.usage.total_tokens,
            }

        return LLMResponse(
            content=content,
            parsed=parsed,
            provider=self.name,
            model=kwargs["model"],
            usage=usage,
            # Do not retain the complete provider response; it may contain
            # sensitive user input and is not needed by the analysis service.
            raw=None,
        )
