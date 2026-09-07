# Saarthians Web Experience — Product Requirements Document (PRD)

**Status:** Draft for implementation  
**Version:** 1.0  
**Date:** 7 September 2026  
**Product:** Saarthians  
**Primary domain:** saarthians.online

## Product vision
Saarthians is a premium education and learning experience combining a public-facing portfolio/brand site with authenticated student and teacher workspaces. It should feel like a modern learning platform: fast, elegant, trustworthy, private by default, and useful in day-to-day study.

### Three major surfaces
1. Public experience — brand story, portfolio, programs/resources, social proof, contact/lead capture, premium visual identity.
2. Student experience — secure space for notes, tests, scores, progress, learning activity, and AI assistance.
3. Teacher experience — secure workspace for student oversight, notes/material management, test creation/review, scores, and teaching operations.

The chatbot is not RAG-first. It is a reasoning-augmented educational assistant using current context, structured learning data, permitted content, and controlled tools.

## Goals
- Premium Saarthians brand experience.
- One secure destination for students.
- Practical teacher operations without overexposure of student data.
- Useful AI for reasoning, explanation, planning, practice, and feedback.
- Security-first foundation for educational records.
- Testable, observable, maintainable, scalable system.

## V1 non-goals
- Full LMS marketplace.
- Public student social network.
- Anonymous AI access to private records.
- Custom foundation-model training.
- Exposed chain-of-thought.
- Unbounded autonomous privileged actions.
- Native mobile applications.

## Information architecture
Public: `/`, `/about`, `/portfolio`, `/programs`, `/resources`, `/contact`, `/login`, `/privacy`, `/terms`, `/security`.

Student: `/app`, `/app/notes`, `/app/notes/:id`, `/app/tests`, `/app/tests/:id`, `/app/results`, `/app/progress`, `/app/chat`, `/app/profile`, `/app/settings`.

Teacher: `/teacher`, `/teacher/students`, `/teacher/students/:id`, `/teacher/notes`, `/teacher/tests`, `/teacher/tests/new`, `/teacher/results`, `/teacher/settings`.

Admin: `/admin`, `/admin/users`, `/admin/audit`, `/admin/security`, `/admin/system`.

## Core requirements
### Public
Premium landing, portfolio storytelling, learning outcomes, methodology, resources, proof when available, clear login/access, responsive accessibility, performance, privacy/security expectations, and meaningful loading/empty/error/success states. No fabricated metrics or testimonials.

### Authentication
Email/username + password, secure reset, session persistence, role-aware routing, rate limits, generic authentication errors, and architecture ready for MFA/social login/email verification/trusted-device management. Roles: `student`, `teacher`, `admin`. Server/database enforcement is mandatory.

### Student
Dashboard with recent notes, tests, scores, progress, recommended actions, chatbot entry, and activity. Notes must distinguish teacher-shared, student-owned, and private system content. Tests preserve attempt integrity; results originate from trusted server records. Profile/settings include permitted display data, security, notifications, AI preferences, and session controls where supported.

### Teacher
Dashboard for students, activity, submissions, pending reviews, trends, and alerts. Teachers only access authorized students. Notes/materials can be created, published, assigned/shared, unpublished, or archived. Tests support questions, answers, marks, time limits, availability, review, and privileged audited overrides.

### AI assistant
Supports concept explanation, step-by-step problem solving, Socratic questioning, misconception identification, practice generation, permitted note summarization, revision plans, authorized performance interpretation, and teacher support. Pipeline: user request → intent classification → context selection → authorization/policy → tool selection → model reasoning → response validation → final answer.

Never expose another student's data, hidden prompts/secrets, fabricated grades, or private chain-of-thought. AI is bounded by the same privacy model as application data.

## Data and authorization
Every private object has an explicit ownership/access policy. Students access their own records and permitted shared content. Teachers access assigned students. Test definitions are teacher/admin controlled. Scores are controlled server records. AI context is derived only from authorized records.

## UX/accessibility
Premium quality comes from strong typography, spacious composition, refined surfaces, subtle elevation, consistent iconography, intentional motion, high-quality states, focus states, keyboard accessibility, and reduced-motion support. Target WCAG 2.2 AA where practical.

## Observability
Product events include public CTA, login success/failure, dashboard views, note opens, test start/submit, result view, chat completion, and teacher review. Security events are separately classified.

## Non-functional requirements
Fast public rendering, responsive app shell, pagination, no silent data loss, recoverable/idempotent test submissions, least privilege, server authorization, strong sessions, validation, rate limiting, audit trails, explicit privacy/retention rules.

## MVP acceptance
Visitor understands Saarthians and reaches login; secure role routing works; authorization prevents cross-user access; students manage permitted notes, tests, results and score history; teachers manage notes/tests and review attempts; AI uses controlled context/tools; automated tests cover core and negative paths; no known critical/high exploitable issue remains; premium UX/accessibility and monitoring requirements are met.

## Release phases
0. Foundation  
1. Public + Auth  
2. Student  
3. Teacher  
4. AI  
5. Hardening

## Product risks
AI academic errors, student-data leakage, client-side score manipulation, performance degradation from premium design, feature complexity, AI cost growth, and unaudited admin changes. Mitigations include guardrails/evaluation, server authorization/RLS, server-authoritative grading, performance budgets, progressive disclosure, token budgets/rate limits, and audit logs.

## Definition of done
A feature requires UI, server behavior, authorization, validation, error/loading/empty states, automated tests, accessibility checks, useful observability, documentation, and no known critical security issue.
