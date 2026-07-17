"""LLMClient - 统一的 LLM 调用入口。

根据 ``settings.LLM_PROVIDER`` 选择 provider：
- ``mock``（默认）: 无需 API key，返回预设结构
- ``openai``: 调用 OpenAI 兼容接口，需要 ``OPENAI_API_KEY``
"""
from __future__ import annotations

from functools import lru_cache

from app.core.config import settings

from .base import (
    AnalysisResult,
    LLMMessage,
    LLMProvider,
    LLMResponse,
    RiskLevel,
)
from .mock_provider import MockProvider
from .openai_provider import OpenAIProvider


def _build_provider() -> LLMProvider:
    provider = (settings.LLM_PROVIDER or "mock").lower()
    if provider == "openai":
        if not settings.OPENAI_API_KEY:
            raise RuntimeError(
                "LLM_PROVIDER=openai 但 OPENAI_API_KEY 未设置；"
                "请配置 API key 或改用 LLM_PROVIDER=mock"
            )
        return OpenAIProvider(
            api_key=settings.OPENAI_API_KEY,
            api_base=settings.OPENAI_API_BASE,
            default_model=settings.OPENAI_MODEL,
            timeout=settings.LLM_TIMEOUT_SECONDS,
            max_retries=settings.LLM_MAX_RETRIES,
        )
    if provider == "mock":
        return MockProvider()
    raise ValueError(f"未知 LLM_PROVIDER: {provider}")


@lru_cache(maxsize=1)
def get_llm_client() -> "LLMClient":
    """单例 LLMClient，全应用复用。"""
    return LLMClient(_build_provider())


class LLMClient:
    """对外暴露的 LLM 客户端。"""

    def __init__(self, provider: LLMProvider):
        self.provider = provider

    async def chat(
        self,
        messages: list[LLMMessage],
        *,
        model: str | None = None,
        temperature: float = 0.3,
        response_format: dict | None = None,
    ) -> LLMResponse:
        return await self.provider.chat(
            messages,
            model=model,
            temperature=temperature,
            response_format=response_format,
        )

    async def analyze(
        self,
        messages: list[LLMMessage],
        *,
        model: str | None = None,
        temperature: float = 0.3,
    ) -> AnalysisResult:
        """便捷方法：调用 LLM 并返回解析后的 AnalysisResult。

        如果 LLM 输出无法解析为 AnalysisResult，会构造一个 fallback
        结果，保证不抛异常打断业务流程。
        """
        resp = await self.chat(
            messages,
            model=model,
            temperature=temperature,
        )
        if resp.parsed is not None:
            return resp.parsed
        return AnalysisResult(
            summary="AI 输出无法解析为标准结构，请参考原文。",
            risk_level=RiskLevel.MEDIUM,
            risk_points=[],
            key_facts=[],
            assumptions=[],
            suggested_actions=[],
            questions_to_verify=[],
            evidence_checklist=[],
            counter_scripts=[],
            help_channels=[],
            templates=[],
            similar_cases=[],
            disclaimer="本分析仅供参考，不构成法律、金融或医疗建议。",
        )
