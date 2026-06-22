"""Test suite for the Softlend Rule Engine.

Covers 6+ test cases as specified in the assignment:
  1. All gap rules fire — 5+ gaps returned, sorted correctly by impact
  2. No gaps found — gaps_found: 0, empty list
  3. action_template substitution — {current_value} replaced with actual value
  4. All eligibility rules pass — eligible: true, fail_reasons: []
  5. Multiple rules fail — All failures listed in fail_reasons
  6. Missing field in input — Engine returns clear error, does not crash
"""

import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.config.loader import load_rules
from src.engine.gap_engine import GapEngine
from src.engine.eligibility_engine import EligibilityEngine
from src.models.report import CreditReport, CustomerProfile


class TestGapAnalysis(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        config = load_rules()
        cls.engine = GapEngine(config["gap_rules"])
        cls.eligibility_engine = EligibilityEngine(config["eligibility_rules"])

    def test_all_gap_rules_fire_and_sorted(self):
        """Test 1: All gap rules fire, sorted correctly by impact then score_gain desc."""
        report_data = {
            "customer_id": "C001",
            "credit_utilisation_pct": 87,
            "missed_payments_12m": 2,
            "written_off_accounts": 1,
            "credit_age_months": 14,
            "hard_enquiries_6m": 5,
            "default_accounts_24m": 1,
        }

        report = CreditReport(report_data)
        result = self.engine.analyse(report)

        self.assertEqual(result["mode"], "gap_analysis")
        self.assertEqual(result["customer_id"], "C001")
        self.assertGreaterEqual(result["gaps_found"], 5)

        gaps = result["gaps"]

        for i in range(len(gaps) - 1):
            curr_impact = {"high": 0, "medium": 1, "low": 2}[gaps[i]["impact"]]
            next_impact = {"high": 0, "medium": 1, "low": 2}[gaps[i + 1]["impact"]]
            self.assertLessEqual(curr_impact, next_impact)

            if curr_impact == next_impact:
                self.assertGreaterEqual(
                    gaps[i]["estimated_score_gain"],
                    gaps[i + 1]["estimated_score_gain"],
                )

    def test_no_gaps_found(self):
        """Test 2: No gaps found when all fields are ideal."""
        report_data = {
            "customer_id": "C002",
            "credit_utilisation_pct": 15,
            "missed_payments_12m": 0,
            "written_off_accounts": 0,
            "credit_age_months": 48,
            "hard_enquiries_6m": 1,
            "default_accounts_24m": 0,
        }

        report = CreditReport(report_data)
        result = self.engine.analyse(report)

        self.assertEqual(result["gaps_found"], 0)
        self.assertEqual(result["gaps"], [])
        self.assertEqual(result["total_potential_score_gain"], 0)

    def test_action_template_substitution(self):
        """Test 3: {current_value} and {ideal_value} are substituted correctly."""
        report_data = {
            "customer_id": "C003",
            "credit_utilisation_pct": 87,
            "missed_payments_12m": 0,
            "written_off_accounts": 0,
            "credit_age_months": 48,
            "hard_enquiries_6m": 1,
            "default_accounts_24m": 0,
        }

        report = CreditReport(report_data)
        result = self.engine.analyse(report)

        utilisation_gap = next(g for g in result["gaps"] if g["id"] == "high_utilisation")
        self.assertIn("87", utilisation_gap["action"])
        self.assertIn("30", utilisation_gap["action"])

    def test_missing_field_returns_warning(self):
        """Test 6: Missing field produces warning, does not crash."""
        report_data = {
            "customer_id": "C004",
            "credit_utilisation_pct": 87,
            "written_off_accounts": 0,
            "hard_enquiries_6m": 1,
        }

        report = CreditReport(report_data)
        result = self.engine.analyse(report)

        self.assertIn("warnings", result)
        self.assertGreater(len(result["warnings"]), 0)


class TestEligibilityEvaluation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        config = load_rules()
        cls.engine = EligibilityEngine(config["eligibility_rules"])

    def test_all_rules_pass(self):
        """Test 4: All eligibility rules pass."""
        profile_data = {
            "customer_id": "C010",
            "age": 30,
            "cibil_score": 720,
            "monthly_income": 80000,
            "existing_emis": 15000,
            "foir": 0.1875,
            "employment_type": "salaried",
            "written_off_accounts": 0,
            "requested_amount": 400000,
        }

        profile = CustomerProfile(profile_data)
        result = self.engine.evaluate(profile)

        self.assertEqual(result["mode"], "eligibility")
        self.assertTrue(result["eligible"])
        self.assertEqual(result["fail_reasons"], [])
        self.assertEqual(result["next_step"], "Customer is eligible. Proceed with loan processing.")

    def test_multiple_rules_fail(self):
        """Test 5: Multiple rules fail, all listed in fail_reasons."""
        profile_data = {
            "customer_id": "C011",
            "age": 19,
            "cibil_score": 500,
            "monthly_income": 20000,
            "existing_emis": 15000,
            "foir": 0.75,
            "employment_type": "unemployed",
            "written_off_accounts": 2,
            "requested_amount": 500000,
        }

        profile = CustomerProfile(profile_data)
        result = self.engine.evaluate(profile)

        self.assertFalse(result["eligible"])
        self.assertGreater(len(result["fail_reasons"]), 1)

    def test_missing_field_does_not_crash(self):
        """Test 6: Missing fields in eligibility produce failures, not crashes."""
        profile_data = {
            "customer_id": "C012",
            "cibil_score": 500,
        }

        profile = CustomerProfile(profile_data)
        result = self.engine.evaluate(profile)

        self.assertIn("fail_reasons", result)
        self.assertFalse(result["eligible"])

    def test_risk_score_computed(self):
        """Bonus: Weighted risk score is present in output."""
        profile_data = {
            "customer_id": "C013",
            "age": 19,
            "cibil_score": 500,
            "monthly_income": 20000,
            "existing_emis": 15000,
            "foir": 0.75,
            "employment_type": "unemployed",
            "written_off_accounts": 2,
            "requested_amount": 500000,
        }

        profile = CustomerProfile(profile_data)
        result = self.engine.evaluate(profile)

        self.assertIn("risk_score", result)
        self.assertGreater(result["risk_score"], 0)


if __name__ == "__main__":
    unittest.main()
