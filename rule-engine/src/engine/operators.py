"""Operator implementations for the rule engine.

Supported operators:
  - gte: greater than or equal (field >= value)
  - lte: less than or equal (field <= value)
  - gt:  strictly greater than (field > value)
  - lt:  strictly less than (field < value)
  - eq:  equal (field == value)
  - between: inclusive range (min <= field <= max)
  - in: value in list (field in [values])
  - lte_multiplier: field <= another_field * multiplier

Each operator receives:
  - field_val: the value from the input data
  - rule: the full rule dict from YAML config
  - profile: the full profile dict (for lte_multiplier and similar)
"""

from __future__ import annotations
from typing import Any


def op_gte(field_val: Any, rule: dict, **_kwargs) -> bool:
    return field_val >= rule["value"]


def op_lte(field_val: Any, rule: dict, **_kwargs) -> bool:
    return field_val <= rule["value"]


def op_gt(field_val: Any, rule: dict, **_kwargs) -> bool:
    return field_val > rule["value"]


def op_lt(field_val: Any, rule: dict, **_kwargs) -> bool:
    return field_val < rule["value"]


def op_eq(field_val: Any, rule: dict, **_kwargs) -> bool:
    return field_val == rule["value"]


def op_between(field_val: Any, rule: dict, **_kwargs) -> bool:
    return rule["min"] <= field_val <= rule["max"]


def op_in(field_val: Any, rule: dict, **_kwargs) -> bool:
    return field_val in rule["values"]


def op_lte_multiplier(field_val: Any, rule: dict, profile: dict[str, Any] | None = None, **_kwargs) -> bool:
    profile = profile or {}
    multiplier_field_val = profile.get(rule["multiplier_field"], 0)
    if multiplier_field_val is None:
        multiplier_field_val = 0
    return field_val <= multiplier_field_val * rule["multiplier"]


OPERATORS = {
    "gte": op_gte,
    "lte": op_lte,
    "gt": op_gt,
    "lt": op_lt,
    "eq": op_eq,
    "between": op_between,
    "in": op_in,
    "lte_multiplier": op_lte_multiplier,
}
