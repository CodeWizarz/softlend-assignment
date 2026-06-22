# Contributing

## Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Install dependencies (`make install`)
4. Make your changes
5. Run tests (`make test`)
6. Commit using conventional commits (`git commit -m "feat: add amazing feature"`)
7. Push and open a Pull Request

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix   | Usage                          |
|----------|--------------------------------|
| `feat:`  | A new feature                  |
| `fix:`   | A bug fix                      |
| `chore:` | Maintenance, deps, tooling     |
| `docs:`  | Documentation changes          |
| `refactor:` | Code change with no fix/feature |
| `test:`  | Adding or fixing tests         |
| `style:`  | Formatting, missing semicolons |

## Pull Request Process

1. Ensure tests pass for both backend and rule-engine
2. Update README if introducing new endpoints or config
3. PRs require at least one review before merging

## Code Style

- Backend: ESLint + Prettier (run `npm run lint` and `npm run format`)
- Rule Engine: PEP 8 conventions
- No hardcoded credentials, ports, or secrets
- All errors return consistent `{ error, code }` JSON
