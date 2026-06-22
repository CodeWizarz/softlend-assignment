"""FastAPI HTTP endpoint for the Rule Engine.

Usage:
    uvicorn src.api.server:app --reload --port 8000
    curl -X POST http://localhost:8000/analyse \
      -H "Content-Type: application/json" \
      -d '{"mode": "gap_analysis", "customer_id": "C001", ...}'
"""

from __future__ import annotations
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Any

from src.config.loader import load_rules
from src.engine.gap_engine import GapEngine
from src.engine.eligibility_engine import EligibilityEngine
from src.models.report import CreditReport, CustomerProfile

config = load_rules()
gap_engine = GapEngine(config["gap_rules"])
eligibility_engine = EligibilityEngine(config["eligibility_rules"])

app = FastAPI(
    title="Softlend Rule Engine API",
    version="1.0.0",
    description="Configurable credit gap analysis and loan eligibility evaluation engine.",
)


class AnalyseRequest(BaseModel):
    mode: str = Field(..., pattern="^(gap_analysis|eligibility)$")
    customer_id: str = Field(..., min_length=1)
    # Gap analysis fields
    credit_utilisation_pct: float | None = None
    missed_payments_12m: int | None = None
    written_off_accounts: int | None = None
    credit_age_months: int | None = None
    hard_enquiries_6m: int | None = None
    default_accounts_24m: int | None = None
    # Eligibility fields
    age: int | None = None
    cibil_score: int | None = None
    monthly_income: float | None = None
    existing_emis: float | None = None
    foir: float | None = None
    employment_type: str | None = None
    requested_amount: float | None = None


@app.post("/analyse")
def analyse(req: AnalyseRequest) -> dict[str, Any]:
    """Run gap analysis or eligibility evaluation on the provided data."""
    data = req.model_dump(exclude_none=True)

    try:
        if req.mode == "gap_analysis":
            report = CreditReport(data)
            result = gap_engine.analyse(report)
        else:
            profile = CustomerProfile(data)
            result = eligibility_engine.evaluate(profile)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return result


@app.get("/health")
def health():
    return {"status": "ok", "service": "softlend-rule-engine"}
