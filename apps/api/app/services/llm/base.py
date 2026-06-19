"""LLM provider 抽象基类与公共数据结构。"""
from __future__ import annotations

import json
import re
from abc import ABC, abstractmethod
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    """风险等级，与前端 ``types/index.ts`` 保持一致。"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class LLMMessage(BaseModel):
    """对话消息。"""

    role: str = Field(description="system / user / assistant")
    content: str


class AnalysisResult(BaseModel):
    """AI 分析结构化输出，对应 PRD 第 3 节。

    所有字段都要求 LLM 返回，缺失项由 provider 层补默认值，
    保证前端拿到的结构始终一致。
    """

    summary: str = Field(description="一句话总结")
    risk_level: RiskLevel = Field(description="风险等级")
    risk_points: list[str] = Field(default_factory=list, description="风险点列表")
    key_facts: list[str] = Field(default_factory=list, description="关键事实")
    assumptions: list[str] = Field(default_factory=list, description="推测")
    suggested_actions: list[str] = Field(default_factory=list, description="建议行动")
    questions_to_verify: list[str] = Field(default_factory=list, description="待核实事项")
    evidence_checklist: list[str] = Field(default_factory=list, description="取证清单")
    counter_scripts: list[str] = Field(default_factory=list, description="反套路话术")
    help_channels: list[dict] = Field(default_factory=list, description="求助渠道")
    templates: list[dict] = Field(default_factory=list, description="维权模板")
    similar_cases: list[dict] = Field(default_factory=list, description="相似案例")
    disclaimer: str = Field(default="", description="免责声明")


class LLMResponse(BaseModel):
    """LLM 调用统一返回结构。"""

    content: str = Field(description="原始文本输出")
    parsed: AnalysisResult | None = Field(default=None, description="解析后的结构化结果")
    provider: str = Field(description="实际使用的 provider 名称")
    model: str = Field(default="", description="实际使用的模型名")
    usage: dict[str, Any] = Field(default_factory=dict, description="token 使用统计")
    raw: dict[str, Any] | None = Field(default=None, description="原始响应（调试用）")


class LLMProvider(ABC):
    """LLM provider 抽象基类。"""

    name: str = "base"

    @abstractmethod
    async def chat(
        self,
        messages: list[LLMMessage],
        *,
        model: str | None = None,
        temperature: float = 0.3,
        response_format: dict | None = None,
    ) -> LLMResponse:
        """调用 LLM，返回统一结构。"""
        raise NotImplementedError


def _try_parse_json(content: str) -> dict[str, Any] | None:
    """尝试从文本中提取 JSON 对象，兼容 ```json 代码块。"""
    try:
        return json.loads(content)
    except (json.JSONDecodeError, ValueError):
        pass

    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except (json.JSONDecodeError, ValueError):
            pass

    match = re.search(r"\{.*\}", content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except (json.JSONDecodeError, ValueError):
            pass

    return None


def parse_analysis_result(content: str) -> AnalysisResult | None:
    """把 LLM 文本输出解析成 AnalysisResult，失败返回 None。"""
    data = _try_parse_json(content)
    if data is None:
        return None
    try:
        return AnalysisResult.model_validate(data)
    except Exception:
        return None
