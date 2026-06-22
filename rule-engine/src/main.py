"""Softlend Rule Engine — CLI entry point.

Usage:
    python src/main.py --mode gap_analysis --input report.json
    python src/main.py --mode eligibility --input profile.json
    python src/main.py --mode gap_analysis --input report.json --config custom_rules.yaml
"""

from __future__ import annotations
import argparse
import json
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.config.loader import load_rules
from src.engine.gap_engine import GapEngine
from src.engine.eligibility_engine import EligibilityEngine
from src.models.report import CreditReport, CustomerProfile


def main():
    parser = argparse.ArgumentParser(
        description="Softlend Rule Engine — Credit Gap Analysis & Loan Eligibility",
    )
    parser.add_argument(
        "--mode",
        required=True,
        choices=["gap_analysis", "eligibility"],
        help="Engine mode",
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to input JSON file",
    )
    parser.add_argument(
        "--config",
        default=None,
        help="Path to custom rules.yaml (default: config/rules.yaml)",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print JSON output",
    )

    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(json.dumps({"error": f"Input file not found: {args.input}"}))
        sys.exit(1)

    try:
        config = load_rules(args.config)

        with open(args.input, "r") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

    try:
        if args.mode == "gap_analysis":
            engine = GapEngine(config["gap_rules"])
            report = CreditReport(data)
            result = engine.analyse(report)
        else:
            engine = EligibilityEngine(config["eligibility_rules"])
            profile = CustomerProfile(data)
            result = engine.evaluate(profile)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

    indent = 2 if args.pretty else None
    print(json.dumps(result, indent=indent))


if __name__ == "__main__":
    main()
