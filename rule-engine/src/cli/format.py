"""Rich terminal output formatting for the Rule Engine."""

from __future__ import annotations
from typing import Any

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich.layout import Layout
from rich.live import Live
from rich import box

console = Console()

IMPACT_COLORS = {
    "high": "red",
    "medium": "yellow",
    "low": "green",
}


def _score_gauge(score: int, max_score: int = 900) -> Panel:
    """Generate a visual score gauge."""
    pct = min(score / max_score, 1.0)
    if score < 650:
        color = "red"
        label = "POOR"
    elif score < 750:
        color = "yellow"
        label = "FAIR"
    else:
        color = "green"
        label = "GOOD"

    bar_width = 40
    filled = int(bar_width * pct)
    bar = f"[{color}]\\u2588" * filled + f"[white]\\u2591" * (bar_width - filled)

    gauge = Panel(
        f"\n  Score: [bold {color}]{score}[/bold {color}] / {max_score}  [{color}]{label}[/{color}]\n"
        f"  [{color}]{bar}[/{color}]\n"
        f"  [dim]300[/dim]{' ' * (bar_width - 8)}[dim]900[/dim]",
        title="[bold]CIBIL Score[/bold]",
        border_style=color,
        box=box.ROUNDED,
    )
    return gauge


def print_gap_analysis(result: dict[str, Any]) -> None:
    """Print gap analysis results with rich formatting."""
    console.print()
    console.print(Panel(
        f"[bold]Customer:[/bold] {result['customer_id']}  "
        f"[bold]Gaps Found:[/bold] {result['gaps_found']}  "
        f"[bold]Potential Gain:[/bold] [green]+{result['total_potential_score_gain']} pts[/green]",
        title="[bold]Credit Gap Analysis[/bold]",
        box=box.DOUBLE,
    ))

    if not result["gaps"]:
        console.print("\n[green]\\u2713 No credit gaps found. Your credit profile is healthy![/green]")
        return

    table = Table(
        title="Gap Breakdown (sorted by impact \\u2192 score gain)",
        box=box.SIMPLE,
        header_style="bold",
    )
    table.add_column("#", style="dim", width=3)
    table.add_column("Gap", style="bold", width=30)
    table.add_column("Impact", width=10)
    table.add_column("Gain", justify="right", width=10)
    table.add_column("Recommended Action", width=70)

    for i, gap in enumerate(result["gaps"], 1):
        impact_color = IMPACT_COLORS.get(gap["impact"], "white")
        table.add_row(
            str(i),
            gap["id"].replace("_", " ").title(),
            f"[{impact_color}]{gap['impact'].upper()}[/{impact_color}]",
            f"[green]+{gap['estimated_score_gain']} pts[/green]",
            gap["action"],
        )

    console.print()
    console.print(table)

    console.print()
    console.print(Panel(
        f"[bold]Summary:[/bold] Fixing all {result['gaps_found']} gap(s) can recover "
        f"[bold green]+{result['total_potential_score_gain']} points[/bold green].",
        box=box.ROUNDED,
    ))

    if "warnings" in result:
        for w in result["warnings"]:
            console.print(f"[yellow]\\u26a0 {w}[/yellow]")


def print_eligibility(result: dict[str, Any]) -> None:
    """Print eligibility evaluation results with rich formatting."""
    console.print()
    eligible = result["eligible"]
    status_color = "green" if eligible else "red"
    status_text = "ELIGIBLE" if eligible else "NOT ELIGIBLE"

    console.print(Panel(
        f"[bold]Customer:[/bold] {result['customer_id']}  "
        f"[bold]Verdict:[/bold] [{status_color}]{status_text}[/{status_color}]  "
        f"[bold]Risk Score:[/bold] {result.get('risk_score', 'N/A')}%",
        title="[bold]Loan Eligibility Evaluation[/bold]",
        box=box.DOUBLE,
    ))

    for group in result.get("groups", []):
        group_passed = group["passed"]
        gcolor = "green" if group_passed else "red"
        console.print()
        console.print(Panel(
            f"[bold]Group:[/bold] {group.get('group', group.get('name', 'Unknown'))}  "
            f"[bold]Logic:[/bold] {group['logic']}  "
            f"[{gcolor}][bold]{'\\u2713 PASS' if group_passed else '\\u2717 FAIL'}[/bold][/{gcolor}]",
            border_style=gcolor,
            box=box.ROUNDED,
        ))

        rule_table = Table(box=box.SIMPLE, header_style="bold")
        rule_table.add_column("Rule", style="bold", width=25)
        rule_table.add_column("Status", width=12)
        rule_table.add_column("Reason", width=70)

        for rule in group["rules"]:
            passed = rule["passed"]
            rcolor = "green" if passed else "red"
            rstatus = "[green]\\u2713 PASS[/green]" if passed else "[red]\\u2717 FAIL[/red]"
            reason = rule.get("reason", "") if not passed else ""
            rule_table.add_row(rule["rule"], rstatus, reason)

        console.print(rule_table)

    if result["fail_reasons"]:
        console.print()
        console.print(f"[red]\\u2717 Failed rules: {', '.join(result['fail_reasons'])}[/red]")

    console.print()
    console.print(Panel(
        f"[bold]Next Step:[/bold] {result.get('next_step', '')}",
        box=box.ROUNDED,
    ))
