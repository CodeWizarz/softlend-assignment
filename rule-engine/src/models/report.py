from __future__ import annotations
from typing import Any


class CreditReport:
    """Represents a customer's credit report for gap analysis."""

    def __init__(self, data: dict[str, Any]):
        self._data = data
        self.customer_id: str = str(data.get("customer_id", ""))

    def get(self, field: str, default: Any = None) -> Any:
        return self._data.get(field, default)

    def has_field(self, field: str) -> bool:
        return field in self._data

    def to_dict(self) -> dict[str, Any]:
        return dict(self._data)


class CustomerProfile:
    """Represents a customer profile for eligibility evaluation."""

    def __init__(self, data: dict[str, Any]):
        self._data = data
        self.customer_id: str = str(data.get("customer_id", ""))

    def get(self, field: str, default: Any = None) -> Any:
        return self._data.get(field, default)

    def has_field(self, field: str) -> bool:
        return field in self._data

    def to_dict(self) -> dict[str, Any]:
        return dict(self._data)
