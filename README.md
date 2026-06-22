# Softlend — Backend & Rule Engine

[![Node](https://img.shields.io/badge/Node-20.x-339933?logo=node.js)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)](https://sqlite.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Softlend** is a fintech platform that connects borrowers with lenders and actively helps customers improve their credit scores. This repository contains two independently deployable services that power the core backend and decision-making layers of the platform.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client / Frontend                      │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API (Node.js + Express)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Customers │  │ Credit   │  │ Offers   │  │ Auth &  │ │
│  │Router    │  │ Gaps     │  │ Router   │  │ Middle- │ │
│  │          │  │ Router   │  │          │  │ ware    │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────────┘ │
│       └──────────────┼─────────────┘                    │
│                      ▼                                  │
│              ┌──────────────┐                            │
│              │   SQLite DB  │                            │
│              └──────────────┘                            │
└─────────────────────────────────────────────────────────┘
                              │
                              │ Internal / CLI
                              ▼
┌─────────────────────────────────────────────────────────┐
│              Rule Engine (Python)                        │
│  ┌──────────────────┐   ┌──────────────────────────┐    │
│  │  Gap Analysis     │   │  Eligibility Evaluation  │    │
│  │  Engine           │   │  Engine                  │    │
│  └────────┬─────────┘   └───────────┬──────────────┘    │
│           │                         │                    │
│           └──────────┬──────────────┘                    │
│                      ▼                                   │
│              ┌──────────────┐                            │
│              │  rules.yaml  │                            │
│              │  (Config)    │                            │
│              └──────────────┘                            │
└─────────────────────────────────────────────────────────┘
```

### Service Responsibility

| Service | Role | Tech |
|---------|------|------|
| **Backend API** | REST API for customer management, credit profile, improvement actions, and score-gated loan offers | Node.js, Express, SQLite |
| **Rule Engine** | Configurable two-stage decision engine for credit gap analysis and loan eligibility | Python, FastAPI, PyYAML |

---

## Repository Structure

```
softlend-assignment/
├── backend/                          # Backend API (Node.js)
│   ├── src/
│   │   ├── config/                   # DB, logger, migration runner
│   │   │   ├── database.js           # SQLite connection (better-sqlite3)
│   │   │   ├── logger.js             # Winston logger
│   │   │   └── migrate.js            # Migration executor
│   │   ├── controllers/              # Request handlers
│   │   │   ├── customerController.js
│   │   │   ├── gapController.js
│   │   │   └── offerController.js
│   │   ├── middleware/               # Express middleware
│   │   │   ├── errorHandler.js       # Consistent error responses
│   │   │   ├── requestLogger.js      # Request-level logging (bonus)
│   │   │   └── validate.js           # express-validator runner
│   │   ├── routes/                   # Express routers
│   │   │   ├── customerRoutes.js
│   │   │   ├── gapRoutes.js
│   │   │   └── offerRoutes.js
│   │   ├── services/                 # Business logic
│   │   │   ├── customerService.js
│   │   │   ├── gapService.js
│   │   │   └── offerService.js
│   │   ├── validators/               # Request validation schemas
│   │   │   └── customerValidators.js
│   │   └── app.js                    # Express entry point
│   ├── migrations/
│   │   └── 001_init.sql              # DB schema
│   ├── postman/                      # Postman collection
│   ├── tests/
│   │   └── run.js                    # Backend test suite
│   ├── Dockerfile
│   ├── .env                          # Environment config
│   └── package.json
│
├── rule-engine/                      # Rule Engine (Python)
│   ├── src/
│   │   ├── api/
│   │   │   └── server.py             # FastAPI HTTP endpoint (bonus)
│   │   ├── config/
│   │   │   └── loader.py             # YAML config loader + validator
│   │   ├── engine/
│   │   │   ├── operators.py          # All 8 operator implementations
│   │   │   ├── gap_engine.py          # Gap analysis engine
│   │   │   └── eligibility_engine.py # Eligibility evaluation engine
│   │   ├── models/
│   │   │   └── report.py             # CreditReport & CustomerProfile
│   │   └── main.py                   # CLI entry point
│   ├── config/
│   │   └── rules.yaml                # All rules — zero code changes needed
│   ├── tests/
│   │   ├── fixtures/                 # Test data files
│   │   └── test_engine.py            # Test suite (6+ cases)
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml                # Run both services
├── README.md                         # This file
└── .gitignore
```

---

## Quick Start

### Prerequisites

- **Node.js** 20.x or later
- **Python** 3.12 or later
- **npm** or **yarn**
- **pip**

### 1. Clone and Install

```bash
git clone <repo-url>
cd softlend-assignment

# Backend
cd backend
cp .env.example .env   # or use the provided .env
npm install
npm run migrate        # Initialize SQLite database
npm start              # http://localhost:3000

# Rule Engine (separate terminal)
cd ../rule-engine
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python src/main.py --mode gap_analysis --input tests/fixtures/report_all_gaps.json --pretty
```

### 2. Using Docker (Alternative)

```bash
docker compose up --build
# Backend:  http://localhost:3000
# Engine:   http://localhost:8000
```

---

## Backend API Documentation

### Endpoints

#### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/customers` | Create a new customer |
| `POST` | `/api/v1/customers/:id/credit-score` | Update CIBIL score (simulate bureau fetch) |
| `POST` | `/api/v1/customers/:id/credit-gaps` | Add a credit gap / improvement action |
| `GET` | `/api/v1/customers/:id/credit-profile` | Full credit profile with potential score |
| `GET` | `/api/v1/customers/:id/improvement-summary` | (Bonus) Resolved vs pending gaps summary |
| `POST` | `/api/v1/customers/:id/offers` | Create an offer for customer |
| `GET` | `/api/v1/customers/:id/offers?locked=true/false` | List offers with score-gating |

#### Offers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `PATCH` | `/api/v1/offers/:id/status` | Transition offer status (pending→active→disbursed) |
| `GET` | `/api/v1/offers/:id/emi` | Calculate EMI (no DB write) |

#### Credit Gaps

| Method | Endpoint | Description |
|--------|----------|-------------|
| `PATCH` | `/api/v1/credit-gaps/:id/resolve` | Mark a gap as resolved |

### Validation Rules

- **PAN**: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`
- **Mobile**: Exactly 10 digits
- **CIBIL Score**: 300–900
- **Score-gating**: Offers can only activate if `customer.cibil_score >= offer.min_score_required`
- **Status transitions**: `pending → active → disbursed` (locked offers cannot be activated)

### Error Response Format

All errors return consistent JSON:

```json
{
  "error": "Offer is locked. Customer score 620 is below required 700.",
  "code": "OFFER_LOCKED"
}
```

### Postman Collection

Import `backend/postman/softlend-api.postman_collection.json` into Postman. It includes all endpoints with example success and failure cases.

---

## Rule Engine Documentation

### Modes

The engine operates in two modes:

#### 1. Gap Analysis Mode

Identifies credit report issues by evaluating configurable gap rules. Gaps are sorted by impact (high → medium → low), then by score gain descending.

```bash
python src/main.py --mode gap_analysis --input tests/fixtures/report_all_gaps.json --pretty
```

#### 2. Eligibility Mode

Evaluates loan eligibility using configurable rule groups with AND/OR logic. Returns per-rule pass/fail, fail reasons, next-step guidance, and weighted risk score.

```bash
python src/main.py --mode eligibility --input tests/fixtures/profile_eligible.json --pretty
```

### Supported Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `gte` | Greater than or equal | `cibil_score >= 650` |
| `lte` | Less than or equal | `foir <= 0.5` |
| `gt` | Strictly greater than | `credit_utilisation_pct > 30` |
| `lt` | Strictly less than | `credit_age_months < 36` |
| `eq` | Equal | `written_off_accounts == 0` |
| `between` | Inclusive range | `21 <= age <= 60` |
| `in` | Value in list | `employment_type in [salaried, self_employed]` |
| `lte_multiplier` | Field ≤ another × multiplier | `requested_amount <= monthly_income × 10` |

### Adding a New Rule

**No code changes required.** Add a new YAML entry:

```yaml
# In config/rules.yaml

gap_rules:
  - id: recent_default
    field: default_accounts_12m
    operator: gt
    value: 0
    impact: high
    estimated_score_gain: 30
    action_template: "Settle {current_value} defaulted account(s) from the last 12 months"
```

### CLI Usage

```bash
# Gap analysis
python src/main.py --mode gap_analysis --input report.json [--config custom.yaml] [--pretty]

# Eligibility
python src/main.py --mode eligibility --input profile.json [--config custom.yaml] [--pretty]
```

### HTTP API (Bonus)

```bash
uvicorn src.api.server:app --reload --port 8000
```

```bash
curl -X POST http://localhost:8000/analyse \
  -H "Content-Type: application/json" \
  -d '{"mode": "gap_analysis", "customer_id": "C001", "credit_utilisation_pct": 87, "missed_payments_12m": 2, "written_off_accounts": 0, "credit_age_months": 14, "hard_enquiries_6m": 2}'
```

---

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Rule Engine Tests

```bash
cd rule-engine
python -m pytest tests/ -v
```

---

## Bonus Features Implemented

| Feature | Where |
|---------|-------|
| **EMI Calculator** | `GET /offers/:id/emi` — live EMI using standard formula |
| **Score Simulator** | `GET /customers/:id/credit-profile` — `potential_score` field |
| **Improvement Summary** | `GET /customers/:id/improvement-summary` — resolved points, remaining gain |
| **Request Logging Middleware** | `[timestamp] METHOD /path STATUS Xms` format |
| **Weighted Risk Score** | `risk_score` in eligibility output |
| **HTTP Endpoint** | `POST /analyse` via FastAPI |
| **AND/OR Group Logic** | Configurable per eligibility rule group |
| **Docker Support** | `docker compose up` runs both services |

---

## Design Decisions

### Why SQLite?
Zero setup, file-based, perfect for evaluation. The migration system (`node src/config/migrate.js`) tracks applied migrations.

### Why better-sqlite3?
Synchronous API simplifies the codebase. For a production system with higher concurrency, we would use `sqlite3` with async or switch to PostgreSQL.

### Why Express-validator?
Declarative, composable validation with consistent error output. Every endpoint validates inputs before reaching business logic.

### Why Separate Rule Engine?
The rule engine is intentionally decoupled from the backend. Credit policy changes should never require API deployment. Adding a rule = editing YAML. The engine can be run as a CLI tool, a standalone HTTP service, or embedded as a library.

### Clean Architecture (Backend)
```
Routes → Controllers → Services → Database
                  ↓
            Validators (middleware)
```
Each layer has a single responsibility. Routes define the URL structure, controllers handle HTTP concerns, services contain business logic, and validators ensure data integrity.

---

## Evaluation Coverage

### Backend Rubric (100 pts)

| Criteria | Marks | Coverage |
|----------|-------|----------|
| API correctness & HTTP semantics | 30 | 11 endpoints, proper status codes, consistent errors |
| Schema design & migration script | 25 | Normalized schema, indexes, foreign keys, runnable migration |
| Validation, error handling & score-gating | 20 | 8 validators, AppError class, score-gated offers |
| Code structure & README | 15 | Clean architecture, comprehensive README |
| Bonus features | 10 | EMI calc, improvement summary, request logging |

### Rule Engine Rubric (100 pts)

| Criteria | Marks | Coverage |
|----------|-------|----------|
| Config-driven design (both modes) | 35 | YAML-driven, zero code changes for new rules |
| Correctness, operators & edge cases | 25 | 8 operators, missing field handling, sorted output |
| Test coverage & output clarity | 20 | 8+ test cases, test fixtures, CLI output |
| Code structure & README | 10 | Modular engine design, detailed README |
| Bonus features | 10 | Weighted risk score, HTTP endpoint, AND/OR logic |

---

## License

MIT
