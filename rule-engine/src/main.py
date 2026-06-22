"""Softlend Rule Engine — CLI entry point.

Usage:
    python src/main.py --mode gap_analysis --input report.json
    python src/main.py --mode eligibility --input profile.json
    python src/main.py --mode gap_analysis --input report.json --config custom_rules.yaml
    python src/main.py --mode gap_analysis --input report.json --report report.html
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
from src.cli.format import print_gap_analysis, print_eligibility
from src.cli.report import generate_html_report


def main():
    parser = argparse.ArgumentParser(
        description="Softlend Rule Engine — Credit Gap Analysis & Loan Eligibility",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python src/main.py --mode gap_analysis --input report.json
  python src/main.py --mode eligibility --input profile.json
  python src/main.py --mode gap_analysis --input report.json --report report.html
        """,
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
        "--report",
        default=None,
        help="Path to generate HTML report (gap_analysis only)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output raw JSON instead of rich terminal output",
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

            if args.json:
                print(json.dumps(result, indent=2))
            else:
                print_gap_analysis(result)

            if args.report:
                html = generate_html_report(result, "gap_analysis")
                os.makedirs(os.path.dirname(args.report) or ".", exist_ok=True)
                with open(args.report, "w") as f:
                    f.write(html)
                print(f"\n  HTML report saved to: {args.report}")
        else:
            engine = EligibilityEngine(config["eligibility_rules"])
            profile = CustomerProfile(data)
            result = engine.evaluate(profile)

            if args.json:
                print(json.dumps(result, indent=2))
            else:
                print_eligibility(result)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
