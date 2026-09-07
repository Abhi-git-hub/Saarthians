# Saarthians Web Experience — Technical Requirements Document (TRD)

**Status:** Draft for implementation  
**Version:** 1.0  
**Date:** 7 September 2026  
**Product:** Saarthians  
**Primary domain:** saarthians.online

## Architecture
Browser → Web application/BFF → application services → PostgreSQL/object storage → AI orchestration → model provider(s). Cross-cutting concerns: authentication/session management, authorization, rate limiting, audit logging, telemetry/monitoring, and secrets management.

Use a modular monolith for V1 with clear domain modules so later extraction remains possible.

## Technology baseline
Next.js App Router, TypeScript, React, Tailwind/design tokens, accessible primitives, Server Components where beneficial, Client Components only where interactive. Backend uses typed service interfaces and runtime validation such as Zod. Data uses PostgreSQL plus ORM/query layer or typed SQL. Auth uses managed auth or secure application auth with short-lived sessions, rotation, and Secure/HttpOnly cookies. Deployment uses separate development/staging/production environments, CI/CD, and previews.

## Domain modules
`auth`, `users`, `roles`, `students`, `teachers`, `notes`, `tests`, `test-attempts`, `results`, `progress`, `chat`, `ai-policy`, `notifications`, `audit`, `analytics`, `admin`, `files`.

Each module owns domain rules, validation, authorization, persistence, service APIs, and tests. Business logic must not live in presentation components.

## Identity and access
Roles: `student`, `teacher`, `admin`. Use defense in depth: UI visibility, authenticated API/service validation, domain policy checks, database constraints/policies, and audit logs for high-risk privileged changes. Resource ownership and relationship checks are required; a malicious client must not gain access by modifying URLs, bodies, hidden fields, or role values.

## Database model
Core tables: `users`, `student_profiles`, `teacher_profiles`, `teacher_student`, `notes`, `note_shares`, `tests`, `test_questions`, `test_attempts`, `test_answers`, `chat_conversations`, `chat_messages`, `audit_events`.

Academic records and audit events should use append-only or controlled mutation patterns wherever possible.

## Database security
Parameterized/ORM-safe queries, least-privilege database roles, encryption at rest/transport, backups/PITR, RLS/policies where appropriate, no direct client write credentials, and version-controlled migrations. A student may read a note only when owner, explicitly shared, or allowed by publication policy; server and database access layers enforce the same rule.

## Authentication security
If passwords are managed directly, use Argon2id or another modern password hashing scheme; never store plaintext or log passwords/reset tokens. Use Secure/HttpOnly cookies where applicable, SameSite Lax or stricter, Secure in production, rotation after sensitive events, revocation, rate limits, backoff/lockout without enumeration, email verification where required, MFA-ready architecture, and framework-native CSRF protections.

## API
Use typed internal service contracts, boundary validation, consistent error shapes, least-data responses, idempotency for retry-prone writes, and pagination. Core API families cover auth, current user, student notes/tests/results/progress, teacher students/notes/tests/reviews, chat, and admin audit.

## Test integrity
The browser is never authoritative for score totals. Server validates test identity, ownership, availability, timing, and answer structure; grading is server-side; submissions are deterministic/idempotent; attempt transitions are explicit: CREATED → IN_PROGRESS → SUBMITTED → GRADED → REVIEWED. Client attempts to alter marks, correct answers, identity, ownership, availability, or reviewer identity must be ignored/denied.

## AI architecture
AI is reasoning-augmented rather than RAG-first. Flow: user message → normalize/validate → authenticate → load role/permissions → classify intent → select allowed context/tools → retrieve structured facts if needed → construct model input → generation → output validation/policy → stream response → safe telemetry.

Allowlisted tools can include current student progress, recent test results, authorized notes, test context, practice generation, score summaries, and study plans. Every tool independently verifies authorization. Never grant unrestricted SQL/database access.

Keep versioned prompt templates for system policy, student tutor behavior, teacher assistant behavior, contextual learning mode, and formatting. Do not expose hidden chain-of-thought; provide concise teaching rationale/worked steps instead.

## AI security
Treat user/retrieved text as untrusted. Separate instructions from content. Allowlist and validate tools, apply per-user/session rate limits, cap context/tool budgets, sanitize uploads, keep secrets out of model context, test prompt injection, and safely log tool usage/policy decisions.

## File security
When uploads exist: allowlist types, size limits, safe server filenames, private storage, malware scanning where appropriate, MIME/signature validation, quotas, authorization on every download, and short-lived signed URLs for private files.

## Web security baseline
HTTPS, HSTS, security headers, suitable CSP, `X-Content-Type-Options: nosniff`, frame-ancestor/clickjacking protection, referrer policy, safe cookies, validation, XSS protections, SQL injection protections, SSRF/open-redirect protections where applicable, rate limiting, and dependency vulnerability scanning. Validate headers in the actual deployed environment.

## Secrets
Never store secrets in source, public environment variables, client bundles, logs, or issue trackers. Use protected deployment variables/managed secret storage. Rotate credentials according to operational policy and after suspected exposure.

## Observability
Structured logs include request ID, timestamp, route, status, latency, safe authenticated ID, and error class. Never log passwords, reset tokens, full auth headers, secrets, or unnecessary private student content. Monitor latency, error rates, auth failures, submission failures, AI latency/errors/cost estimates, DB latency, and job failures. Alert on elevated 5xx, auth abuse, unusual authorization failures, DB issues, AI provider failures, and backup failures.

## Testing
Unit: score calculation, attempt states, authorization, note visibility, progress, validation, AI tool contracts. Integration: auth, reset, database writes, grading, authorization boundaries, chat orchestration. E2E: visitor→login→dashboard, note→AI explanation, test→result, teacher review, teacher test creation, unauthorized student/teacher access denial, audited admin action. Security: IDOR/BOLA, role escalation, auth bypass, sessions, CSRF, XSS, SQLi, SSRF, open redirects, upload abuse, rate-limit bypass, prompt injection, AI tool authorization, and cross-user AI context leakage.

## Release gate
Dependency audit, static analysis, secret scan, auth/authorization suite, headers, DB policy review, backup restore test, environment review, security review, and remediation/acceptance of critical/high findings. Do not claim “fully secure”; target a defensible, continuously tested security posture with known residual risk.

## Performance
Public Lighthouse Performance target ≥90 where feasible; optimized images/fonts; minimal JS. App dashboard streams/skeletons slow data and paginates large tables. AI streams, returns first useful token quickly, uses timeouts/fallbacks, and cannot block unrelated application actions.

## CI/CD
PR: format/lint → typecheck → unit → integration → build → security/dependency scan → preview. Main: full tests → production build → deploy → smoke tests → monitor. Production migrations are reviewed, backward-compatible where needed, controlled, and reversible/recoverable.

## Environments and recovery
Separate development/staging/production databases, storage, AI keys, auth configuration, and analytics destinations. Never copy production student data into local development without approved anonymization. Define backup frequency, retention, RPO/RTO, and restore owner/process; test restores periodically. Define retention classes for accounts, attempts/results, audit logs, chat, files, and analytics.

## Design system engineering
Shared tokens cover colors, typography, spacing, radius, shadows, motion, breakpoints, z-index, and focus states. Shared components include Button, Input, Select, Modal, Drawer, Card, Badge, Table, Tabs, Toast, Empty State, Skeleton, Dialog, Chat Message, Score Visualization, and Test Question Renderer.

## Production principle
**The browser, AI model, and UI are untrusted participants. The server-side domain layer and database authorization model remain authoritative for identity, access, educational records, and privileged actions.**
