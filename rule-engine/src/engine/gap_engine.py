"""Gap Analysis Engine — identifies credit report gaps using configurable rules."""

from __future__ import annotations
from typing import Any

from src.engine.operators import OPERATORS
from src.models.report import CreditReport

IMPACT_ORDER = {"high": 0, "medium": 1, "low": 2}


class GapEngine:
    """Evaluates credit gap rules against a credit report."""

    def __init__(self, gap_rules: list[dict[str, Any]]):
        self.gap_rules = gap_rules

    def analyse(self, report: CreditReport) -> dict[str, Any]:
        """Run gap analysis. Returns gaps sorted by impact then score_gain desc."""
        gaps = []
        errors = []

        for rule in self.gap_rules:
            field = rule["field"]
            field_val = report.get(field)

            if field_val is None:
                errors.append(f"Missing field '{field}' in credit report")
                continue

            operator_fn = OPERATORS.get(rule["operator"])
            if operator_fn is None:
                errors.append(f"Unknown operator '{rule['operator']}' for rule '{rule['id']}'")
                continue

            profile = report.to_dict()
            fired = operator_fn(
                field_val,
                rule,
                profile=profile,
            )

            if fired:
                current_val_str = str(field_val)
                ideal_val_str = rule.get("ideal_value", str(rule.get("value", "")))

                action = rule["action_template"].format(
                    current_value=current_val_str,
                    ideal_value=ideal_val_str,
                )

                gaps.append({
                    "id": rule["id"],
                    "impact": rule["impact"],
                    "estimated_score_gain": rule["estimated_score_gain"],
                    "action": action,
                })

        gaps.sort(key=lambda g: (IMPACT_ORDER.get(g["impact"], 99), -g["estimated_score_gain"]))

        total_gain = sum(g["estimated_score_gain"] for g in gaps)

        result: dict[str, Any] = {
            "customer_id": report.customer_id,
            "mode": "gap_analysis",
            "gaps_found": len(gaps),
            "total_potential_score_gain": total_gain,
            "gaps": gaps,
        }

        if errors:
            result["warnings"] = errors

        return result
