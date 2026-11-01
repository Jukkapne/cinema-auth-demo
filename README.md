# Cinema authentication and authorization demo

A small React + Express application for teaching authentication, authorization, roles, HTTP-only session cookies, and guest checkout.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The Vite development server proxies `/api` requests to Express on port 3001.

## Demo accounts

All accounts use the password `demo1234`.

| Role | Email |
|---|---|
| Customer | `customer@cinema.test` |
| Cashier | `cashier@cinema.test` |
| Owner | `owner@cinema.test` |

These credentials exist only for classroom use.

## Useful commands

```bash
npm run dev     # React and Express in development mode
npm test        # API authorization tests
npm run build   # production React build
npm start       # Express; serves the build when NODE_ENV=production
```

For a local production-style run, copy `.env.example` to `.env`, replace the secret, build the client, set `NODE_ENV=production`, and start the server. Production requires HTTPS because its cookie uses `Secure` and the `__Host-` prefix.

## What the example demonstrates

- public movie listings
- guest checkout without creating an account
- login with a password hash comparison
- session fixation protection by regenerating the session after login
- an HTTP-only, SameSite cookie
- `401 Unauthorized` for an unauthenticated user
- `403 Forbidden` for an authenticated user without the required role
- reusable `requireAuthentication` and `requireRole` middleware
- server-side authorization even when the UI shows every demo button
- logout and session destruction
- basic login rate limiting

The React application never reads the session cookie. It calls `GET /api/auth/me` to learn whether a user is signed in.

## Deliberate simplifications

This is teaching code, not a deployable ticket shop. Data and sessions disappear when the server restarts. Before production, replace:

- in-memory users and purchases with a database
- Express `MemoryStore` with Redis or another production session store
- the hard-coded password with registration, verification, reset, and secure account recovery
- the fake purchase with expiring seat holds, server-calculated prices, a payment provider, verified webhooks, and idempotency
- the minimal validation with schema validation
- the single-server assumptions with production logging, monitoring, backups, secret management, HTTPS, and tested CSRF controls

Never store payment-card data in this example application.

## Why the course example uses an opaque session cookie

JWT and HTTP-only cookies are not direct alternatives. JWT is a token format. A cookie is a browser storage and transport mechanism. A JWT can itself be put in an HTTP-only cookie.

For this same-origin browser application, a random session ID in an HTTP-only cookie is the smallest useful design:

- browser JavaScript cannot read the credential
- logout and account suspension can take effect immediately
- role changes and session invalidation are straightforward to control on the server
- guest and signed-in sessions use the same mental model
- students can concentrate on server-side authorization

Students may choose JWT for their own project, but they must explain token storage, expiration, refresh, revocation, XSS exposure, CSRF protection when cookies are used, and how role changes take effect. Do not store bearer tokens in `localStorage` in a security-sensitive application.

## Teaching materials

- [`materials/ready-to-use/`](materials/ready-to-use/) — PowerPoint lecture and formatted Word documents for classroom use
- [`materials/LECTURE.md`](materials/LECTURE.md) — slide-ready lecture outline
- [`materials/TEACHER_NOTES.md`](materials/TEACHER_NOTES.md) — timing, explanations, and questions
- [`materials/LIVE_CODING.md`](materials/LIVE_CODING.md) — step-by-step demonstration
- [`materials/DEMO_RUNBOOK_FI.md`](materials/DEMO_RUNBOOK_FI.md) — Finnish action and speaking script for the live demo
- [`materials/EXERCISES.md`](materials/EXERCISES.md) — student exercises and answer guide
- [`materials/SECURITY_CHECKLIST.md`](materials/SECURITY_CHECKLIST.md) — project review checklist

The ready-to-use folder contains:

- `Authentication_and_Authorization_Lecture.pptx` — 21-slide PowerPoint deck
- `Teacher_Preparation_Guide_FI.docx` — Finnish teacher preparation guide
- `Teacher_Notes_EN.docx` — English teacher notes
- `Live_Coding_Guide_EN.docx` — English demonstration runbook
- `Exercises_and_Answer_Guide_EN.docx` — exercises and model answers
- `Security_Checklist_EN.docx` — printable project checklist
- `Demon_suoritusohje_FI.docx` — Finnish step-by-step demo script for the teacher

## Project structure

```text
client/              React + Vite user interface
server/src/app.js    routes and session configuration
server/src/auth.js   authentication and role middleware
server/src/data.js   temporary classroom data
server/test/         authorization tests
materials/           lecture package
```

## References

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP JSON Web Token Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html)
