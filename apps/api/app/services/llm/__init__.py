"""LLM provider 抽象层。

设计目标：
1. 业务层只调用 ``LLMClient.chat(...)``，不感知具体 provider。
2. 通过环境变量 ``LLM_PROVIDER`` 切换 mock / openai。
3. 输入输出结构化，便于前端展示和落库。
"""
from .base import (
    AnalysisResult,
    LLMMessage,
    LLMProvider,
    LLMResponse,
    RiskLevel,
)
from .client import LLMClient, get_llm_client
from .mock_provider import MockProvider
from .openai_provider import OpenAIProvider

__all__ = [
    "AnalysisResult",
    "LLMClient",
    "LLMMessage",
    "LLMProvider",
    "LLMResponse",
    "MockProvider",
    "OpenAIProvider",
    "RiskLevel",
    "get_llm_client",
]
