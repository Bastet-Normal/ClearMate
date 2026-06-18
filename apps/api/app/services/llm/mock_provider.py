"""Mock LLM Provider。

用途：
1. 无 API key 时让整个 AI 闭环跑通，便于开发与测试。
2. 返回与真实 provider 完全一致的结构，业务层无感知。

返回内容根据任务类型给出有意义的预设结果，避免空壳。
"""
from __future__ import annotations

from .base import (
    AnalysisResult,
    LLMMessage,
    LLMProvider,
    LLMResponse,
    RiskLevel,
)

# 风险关键词，用于 mock 评分
_RISK_KEYWORDS: dict[str, int] = {
    "验证码": 2,
    "保证金": 2,
    "稳赚": 2,
    "刷单": 3,
    "先转账": 3,
    "解冻费": 3,
    "客服QQ": 2,
    "内部消息": 2,
    "高回报": 2,
    "零风险": 2,
    "限时": 1,
    "马上": 1,
}


def _guess_risk_level(text: str) -> RiskLevel:
    """根据关键词命中数粗略判断风险等级。"""
    score = sum(weight for kw, weight in _RISK_KEYWORDS.items() if kw in text)
    if score >= 5:
        return RiskLevel.CRITICAL
    if score >= 3:
        return RiskLevel.HIGH
    if score >= 1:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def _build_mock_result(messages: list[LLMMessage]) -> AnalysisResult:
    """根据输入消息构造一份有意义的 mock 分析结果。"""
    user_text = ""
    for msg in messages:
        if msg.role == "user":
            user_text += msg.content + "\n"

    risk_level = _guess_risk_level(user_text)

    risk_points: list[str] = []
    for kw in _RISK_KEYWORDS:
        if kw in user_text:
            risk_points.append(f"命中关键词「{kw}」，常见于诈骗话术")
    if not risk_points:
        risk_points.append("未发现明显风险关键词")

    key_facts: list[str] = []
    if user_text.strip():
        snippet = user_text.strip().replace("\n", " ")[:200]
        key_facts.append(f"用户描述：{snippet}")
    key_facts.append("分析基于 mock provider，未调用真实 LLM")

    return AnalysisResult(
        summary=f"[Mock] 已分析你提交的内容，整体风险等级为 {risk_level.value}。",
        risk_level=risk_level,
        risk_points=risk_points,
        key_facts=key_facts,
        assumptions=[
            "[Mock] 假设用户提交的内容真实完整",
            "[Mock] 假设未涉及未提及的关联交易",
        ],
        suggested_actions=[
            "[Mock] 1. 不要轻易转账或提供验证码",
            "[Mock] 2. 通过官方渠道核实对方身份",
            "[Mock] 3. 如已损失，立即报警并保留证据",
        ],
        questions_to_verify=[
            "[Mock] 对方身份是否可核实？",
            "[Mock] 是否有官方渠道可验证此信息？",
        ],
        disclaimer="本分析由 mock provider 生成，仅供参考，不构成法律、金融或医疗建议。",
    )


class MockProvider(LLMProvider):
    """Mock provider，返回预设结构化结果。"""

    name = "mock"
    model_name = "mock-1.0"

    async def chat(
        self,
        messages: list[LLMMessage],
        *,
        model: str | None = None,
        temperature: float = 0.3,
        response_format: dict | None = None,
    ) -> LLMResponse:
        result = _build_mock_result(messages)
        return LLMResponse(
            content=result.model_dump_json(indent=2),
            parsed=result,
            provider=self.name,
            model=model or self.model_name,
            usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
            raw=None,
        )
