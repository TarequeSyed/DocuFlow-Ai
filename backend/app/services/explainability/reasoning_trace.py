import time
import uuid
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


class ReasoningStep(BaseModel):
    """
    Represents an auditable, individual step within an AI reasoning trail.
    """

    step_number: int
    title: str
    description: str
    input_summary: str | None = None
    output_summary: str | None = None
    confidence: float = 1.0
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class ReasoningTrace(BaseModel):
    """
    Aggregation of reasoning steps, timing, and model provenance.
    """

    trace_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    steps: list[ReasoningStep] = Field(default_factory=list)
    total_execution_ms: float = 0.0
    model_name: str | None = None


class ReasoningTraceBuilder:
    """
    Helper utility to record, compile, and time multi-step AI execution trails.
    """

    def __init__(self, model_name: str | None = "gpt-4o-mini") -> None:
        self.trace_id = str(uuid.uuid4())
        self.steps: list[ReasoningStep] = []
        self.start_time = time.perf_counter()
        self.model_name = model_name

    def add_step(
        self,
        title: str,
        description: str,
        input_summary: str | None = None,
        output_summary: str | None = None,
        confidence: float = 1.0,
    ) -> None:
        step_number = len(self.steps) + 1
        self.steps.append(
            ReasoningStep(
                step_number=step_number,
                title=title,
                description=description,
                input_summary=input_summary,
                output_summary=output_summary,
                confidence=confidence,
            )
        )

    def build(self) -> ReasoningTrace:
        execution_ms = round((time.perf_counter() - self.start_time) * 1000, 2)
        return ReasoningTrace(
            trace_id=self.trace_id,
            steps=self.steps,
            total_execution_ms=execution_ms,
            model_name=self.model_name,
        )
