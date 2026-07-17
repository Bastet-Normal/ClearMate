"""Analysis service - 调用 LLM 完成一次分析并落库。"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analysis import Analysis
from app.models.task import Task
from app.services.llm import AnalysisResult as LLMAnalysisResult
from app.services.llm import LLMClient
from app.services.llm.prompts import build_messages


class AnalysisProviderError(RuntimeError):
    """Raised when the configured model provider cannot complete an analysis."""


class AnalysisService:
    def __init__(self, db: AsyncSession, llm_client: LLMClient):
        self.db = db
        self.llm = llm_client

    async def analyze_task(self, task: Task) -> Analysis:
        """对指定任务执行一次 AI 分析。

        步骤：
        1. 根据 task_type 构造 prompt 消息
        2. 调用 LLM 得到结构化结果
        3. 落库 analyses 表
        4. 同步更新 task.risk_level / task.status
        """
        messages = build_messages(task.task_type, task.title, task.description)
        task.status = "analyzing"
        await self.db.commit()

        try:
            resp = await self.llm.chat(messages)
        except Exception as exc:
            task.status = "failed"
            await self.db.commit()
            raise AnalysisProviderError("模型服务暂时不可用") from exc
        result: LLMAnalysisResult = resp.parsed or LLMAnalysisResult(
            summary=resp.content[:500] if resp.content else "无内容",
            risk_level="medium",
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

        analysis = Analysis(
            task_id=task.id,
            provider=resp.provider,
            model=resp.model,
            prompt_version="v1",
            risk_level=result.risk_level.value,
            result_json=result.model_dump(),
            tokens_used=int(resp.usage.get("total_tokens", 0)),
            raw_response=None,
        )
        self.db.add(analysis)

        # 分析与任务状态在同一事务提交，避免只保存其中一项。
        task.risk_level = result.risk_level.value
        task.status = "waiting_confirmation"

        await self.db.commit()
        await self.db.refresh(analysis)
        return analysis
