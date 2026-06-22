# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅        |

## Reporting a Vulnerability

If you discover a security vulnerability, please do **not** open a public issue.
Instead, email the maintainer directly. You should receive a response within 48 hours.

## Security Practices

- All database queries use parameterized statements (no SQL injection)
- HTTP security headers set via Helmet
- Input validated on every endpoint via express-validator
- Rate limiting configured for production deployments
- `.env` files excluded from version control — no secrets in code
