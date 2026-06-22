.PHONY: install test lint run seed clean demo help

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
	awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	cd backend && npm install
	cd rule-engine && pip install -r requirements.txt

test: ## Run all tests
	cd backend && npm test
	cd rule-engine && python -m pytest tests/ -v

lint: ## Run linters
	cd backend && npm run lint

format: ## Format code
	cd backend && npm run format

seed: ## Seed database with sample data
	cd backend && npm run seed

run-backend: ## Start backend API server
	cd backend && npm start

run-engine: ## Start rule engine HTTP endpoint
	cd rule-engine && uvicorn src.api.server:app --reload --port 8000

run-engine-cli: ## Run rule engine CLI gap analysis demo
	cd rule-engine && python src/main.py --mode gap_analysis --input tests/fixtures/report_all_gaps.json --pretty

demo: ## One-command demo: seed + start backend
	cd backend && npm run seed && npm start

clean: ## Clean generated files
	rm -rf backend/data/
	rm -rf backend/coverage/
	rm -rf rule-engine/.pytest_cache/
	rm -rf rule-engine/__pycache__/
	find . -name '*.pyc' -delete
