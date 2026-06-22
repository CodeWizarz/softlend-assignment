"""Eligibility Evaluation Engine — evaluates loan eligibility using configurable rules.

Supports AND/OR group logic and optional weighted risk score computation.
"""

from __future__ import annotations
from typing import Any

from src.engine.operators import OPERATORS
from src.models.report import CustomerProfile


class EligibilityEngine:
    """Evaluates eligibility rule groups against a customer profile."""

    def __init__(self, eligibility_rules: list[dict[str, Any]]):
        self.eligibility_rules = eligibility_rules

    def evaluate(self, profile: CustomerProfile) -> dict[str, Any]:
        """Evaluate all eligibility rule groups. Returns pass/fail with reasons."""
        all_results = []
        group_verdicts = []
        profile_dict = profile.to_dict()

        for group in self.eligibility_rules:
            group_name = group["name"]
            logic = group.get("logic", "AND")
            rules = group["rules"]

            rule_results = []

            for rule in rules:
                field = rule["field"]
                field_val = profile.get(field)

                if field_val is None:
                    rule_results.append({
                        "rule": rule["id"],
                        "passed": False,
                        "reason": f"Missing field '{field}' in profile",
                    })
                    continue

                operator_fn = OPERATORS.get(rule["operator"])
                if operator_fn is None:
                    rule_results.append({
                        "rule": rule["id"],
                        "passed": False,
                        "reason": f"Unknown operator '{rule['operator']}'",
                    })
                    continue

                passed = operator_fn(
                    field_val,
                    rule,
                    profile=profile_dict,
                )

                entry: dict[str, Any] = {
                    "rule": rule["id"],
                    "passed": passed,
                }

                if not passed:
                    entry["reason"] = rule.get(
                        "message",
                        f"Rule '{rule['id']}' failed",
                    )

                rule_results.append(entry)

            if logic == "AND":
                group_passed = all(r["passed"] for r in rule_results)
            else:
                group_passed = any(r["passed"] for r in rule_results)

            group_verdicts.append({
                "group": group_name,
                "logic": logic,
                "passed": group_passed,
                "rules": rule_results,
            })

            all_results.extend(rule_results)

        overall_eligible = any(v["passed"] for v in group_verdicts)

        fail_reasons = [
            r["rule"] for r in all_results if not r["passed"]
        ]

        result: dict[str, Any] = {
            "customer_id": profile.customer_id,
            "mode": "eligibility",
            "eligible": overall_eligible,
            "groups": group_verdicts,
            "rules": all_results,
            "fail_reasons": fail_reasons,
        }

        next_step_text = self._generate_next_step(fail_reasons, all_results, profile)
        result["next_step"] = next_step_text

        result["risk_score"] = self._compute_weighted_risk(all_results, self.eligibility_rules)

        return result

    def _generate_next_step(
        self,
        fail_reasons: list[str],
        all_results: list[dict[str, Any]],
        profile: CustomerProfile,
    ) -> str:
        if not fail_reasons:
            return "Customer is eligible. Proceed with loan processing."

        if "cibil_score" in fail_reasons:
            score = profile.get("cibil_score", 0)
            needed = 650 - score if score else 650
            return (
                f"Improve CIBIL score by at least {needed} points. "
                "See gap analysis for improvement plan."
            )

        return f"Eligibility failed on: {', '.join(fail_reasons)}. Address these issues and re-apply."

    def _compute_weighted_risk(
        self,
        results: list[dict[str, Any]],
        groups: list[dict[str, Any]],
    ) -> float:
        total_weight = 0.0
        failed_weight = 0.0
        seen = set()

        for group in groups:
            for rule in group.get("rules", []):
                rid = rule["id"]
                if rid in seen:
                    continue
                seen.add(rid)
                weight = rule.get("weight", 1.0 / len(groups[0].get("rules", [])))
                total_weight += weight

                for res in results:
                    if res["rule"] == rid and not res["passed"]:
                        failed_weight += weight
                        break

        if total_weight == 0:
            return 0.0

        return round((failed_weight / total_weight) * 100, 2)
