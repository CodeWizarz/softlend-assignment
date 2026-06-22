"""Configuration loader — reads rules.yaml and validates structure."""

from __future__ import annotations
from typing import Any
import os
import yaml


def load_rules(path: str | None = None) -> dict[str, Any]:
    """Load and validate the rules configuration file."""
    if path is None:
        path = os.path.join(
            os.path.dirname(__file__), "..", "..", "config", "rules.yaml"
        )

    path = os.path.abspath(path)

    if not os.path.exists(path):
        raise FileNotFoundError(f"Rules file not found: {path}")

    with open(path, "r") as f:
        config = yaml.safe_load(f)

    _validate(config)

    return config


def _validate(config: dict[str, Any]) -> None:
    """Validate the config structure."""
    if not isinstance(config, dict):
        raise ValueError("Rules config must be a YAML dictionary")

    if "gap_rules" not in config:
        raise ValueError("Missing 'gap_rules' in config")

    if not isinstance(config["gap_rules"], list):
        raise ValueError("'gap_rules' must be a list")

    if "eligibility_rules" not in config:
        raise ValueError("Missing 'eligibility_rules' in config")

    if not isinstance(config["eligibility_rules"], list):
        raise ValueError("'eligibility_rules' must be a list")

    for rule in config["gap_rules"]:
        _check_keys(rule, {"id", "field", "operator", "value", "impact", "estimated_score_gain", "action_template"})

    for group in config["eligibility_rules"]:
        _check_keys(group, {"name", "logic", "rules"})
        if group.get("logic") not in ("AND", "OR"):
            raise ValueError(f"Invalid logic '{group.get('logic')}' in eligibility group '{group.get('name')}'")
        for rule in group["rules"]:
            _check_keys(rule, {"id", "field", "operator", "message"})


def _check_keys(d: dict[str, Any], required: set[str]) -> None:
    missing = required - set(d.keys())
    if missing:
        raise ValueError(f"Rule missing required keys: {missing}")
