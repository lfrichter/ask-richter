# META_SPEC — ask-richter

**Version:** 2.1.0
**Status:** Active
**Last Updated:** 2026-09-02
**Owner:** Luis Fernando Richter

---

# 1. Project Identity

## 1.1 Name

`ask-richter`

## 1.2 One-Line Description

> An intelligent, interactive portfolio chatbot that transforms Luis F. Richter's professional career, engineering projects, and technical leadership into an authoritative conversational RAG assistant.

## 1.3 Problem

Traditional resumes and static portfolio websites offer one-dimensional, passive reading experiences. Technical recruiters, engineering managers, and executive leaders need quick, nuanced, and verifiable answers to specific inquiries—such as architectural leadership experience, specific tech stacks (e.g., PHP/Laravel, Node.js/TypeScript, Python, LLM orchestration), and real project impact—without sifting through dense static documents.

## 1.4 Target Users

* **Technical Recruiters & Headhunters:** Sourcing specific seniority levels, verified skills, and career trajectories.
* **Engineering Managers & VPs of Engineering:** Assessing architectural maturity, decision-making frameworks, leadership scope, and concrete problem-solving track records.
* **Peer Software Engineers & Collaborators:** Exploring shared technical interests, open-source work, and engineering methodologies.

---

# 2. Vision

## 2.1 Vision Statement

To deliver a gold-standard, zero-hallucination interactive portfolio powered by modern Serverless RAG that demonstrates software engineering excellence, bulletproof operational resilience, and automated governance under the AI Engineering Framework v2.1.

## 2.2 Business / User Outcome

* **Zero-Hallucination Answers:** 100% of claims regarding career history, projects, and certifications are grounded strictly in the verified knowledge base.
* **Instant Conversational Access:** Sub-second to 2-second median response times for natural language questions in English, Portuguese, and Spanish.
* **Zero Infrastructure Overhead:** Serverless V2 architecture eliminating dedicated 24/7 VM container costs and spin-down latencies.

---

# 3. Scope

## 3.1 In Scope

* **Multilingual Conversational RAG (M15):** Generating natural language answers strictly in the user's inquiry language (English, Portuguese, Spanish) while using factual knowledge retrieved from structured data.
* **Pure TypeScript In-Memory Vector Search (`TSVectorStore`):** Cosine similarity retrieval over 768-dimensional Gemini embeddings, eliminating C++ compilation dependencies (`faiss-node`).
* **Pure TypeScript Lexical Search (`SimpleTfIdf`):** Fast keyword matching that eliminates legacy Naive Bayes and C++ dependencies.
* **Operational Resilience & Unfreeze Engine (ADR-0009):** Automated detection of Supabase dormancy, strict 7-state status classification, and server-side programmatic unfreezing via the Supabase Management API.
* **Unified Quality Verification (Jidoka):** Parallel verification of types, linting, and build via `npm run jidoka` across Turborepo workspaces.
* **Offline Knowledge Ingestion Toolkit:** CLI scripts in `apps/backend/src/scripts/` to chunk Markdown documents, compute embeddings, export vectors, and sync assets to Supabase Storage.

## 3.2 Out of Scope

* **Generic Public Chatbot Capabilities:** Answering general-world knowledge questions unrelated to Luis Fernando Richter's professional career or projects.
* **Persistent Multi-User Authentication:** Requiring logins or collecting personally identifiable recruiter data.
* **Real-time Vector Re-indexing on Production Serverless Instances:** Re-indexing is strictly an offline engineering workflow; production runs read-only queries against bundled vector JSONs.
* **Direct Client Access to Supabase Management API:** Web browser clients MUST NEVER hold or use administrative tokens (`SUPABASE_MANAGEMENT_TOKEN`).

> Agents MUST NOT implement functionality listed as Out of Scope without explicit authorization.

---

# 4. Functional Requirements

### FR-001 — Intelligent Conversational RAG (`POST /api/chat`)
**Requirement:** The system must accept natural language queries, classify query intent (`SIMPLE_SEARCH`, `PROJECT_TECHNOLOGY_SEARCH`, `LIST_PROJECTS`), execute hybrid vector and lexical retrieval, assemble a token-budgeted context, and generate an evidence-grounded response.
**Acceptance Criteria:**
* [ ] Decomposes queries according to intent and extracted technologies.
* [ ] Enforces a maximum token budget of 2,800 tokens for assembled context chunks.
* [ ] Returns structured JSON containing `{ answer: string }`.
* [ ] Refuses to invent facts when query context is absent, returning an explicit boundary message.

### FR-002 — Multilingual Response Alignment (M15)
**Requirement:** The language of the user's message dictates the language of the output response, regardless of the language of retrieved context chunks.
**Acceptance Criteria:**
* [ ] Questions asked in English receive answers strictly in English.
* [ ] Questions asked in Portuguese receive answers strictly in Portuguese.
* [ ] Questions asked in Spanish receive answers strictly in Spanish.
* [ ] Factual Portuguese context documents are translated accurately in-flight without losing technical terms.

### FR-003 — Supabase Operational State Machine (ADR-0009)
**Requirement:** The system must classify database/storage availability into one of seven mutually exclusive operational states: `READY`, `PAUSED`, `WAKING`, `UNAVAILABLE`, `TIMEOUT`, `AUTH_ERROR`, or `UNKNOWN`.
**Acceptance Criteria:**
* [ ] Enforces the **Golden Rule of Non-Inference**: Generic network failures (`fetch failed`, `ENOTFOUND`, `ECONNREFUSED`), timeouts, and auth errors are NEVER classified as `PAUSED`.
* [ ] Only explicit Supabase pause signatures (e.g., HTTP 503 with `"project_paused"`) result in state `PAUSED`.
* [ ] Exposes health and state via `GET /api/supabase/status`.

### FR-004 — Server-Side Project Restoration (`POST /api/supabase/restore`)
**Requirement:** When Supabase is paused, the server must securely call the Supabase Management API v1 to trigger project reactivation.
**Acceptance Criteria:**
* [ ] Executes exclusively server-side using `SUPABASE_MANAGEMENT_TOKEN`.
* [ ] Enforces an in-memory idempotency lock (10-second window) preventing duplicate restore requests.
* [ ] Returns sanitized recovery status to the client without exposing internal API tokens.

### FR-005 — Client-Side Progressive Unfreezing Modal
**Requirement:** If Supabase dormancy is detected, the UI must present an unfreeze modal with sequential, progressive polling.
**Acceptance Criteria:**
* [ ] Polling intervals back off progressively: 2s, 3s, 5s, 8s, 13s, with a maximum cap of 15s.
* [ ] Each polling attempt employs an independent `AbortController`.
* [ ] Total SLA is calibrated to 300 seconds (5 minutes) before declaring an unrecoverable timeout.

### FR-006 — Unified Quality Verification (Andon Cord Protocol)
**Requirement:** A single root command must execute the entire verification pipeline with dependency graph orchestration.
**Acceptance Criteria:**
* [ ] `npm run jidoka` orchestrates `check-types`, `lint`, and `build` in parallel.
* [ ] Any failure (exit code != 0) acts as an Andon Cord, aborting the release or commit cycle.

---

# 5. Non-Functional Requirements

## Performance
* **Cold Start Latency:** Serverless route cold start under 1,500ms on Vercel Edge/Node Serverless runtimes.
* **Query Response Time:** Median RAG query turnaround under 2,000ms.
* **Memory Footprint:** In-memory vector store loading `vectors.json` and `docstore.json` must consume under 80MB RAM.

## Security
* **Zero Client Secret Leakage:** `SUPABASE_MANAGEMENT_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, and LLM keys MUST NEVER be bundled into client JavaScript.
* **Production Route Sanitization:** Runtime sanitizer discards any `onrender.com` URLs in `NEXT_PUBLIC_API_BASE_URL` to guarantee all browser requests stay within the trusted origin.

## Reliability
* **Bounded Retries:** Primary LLM calls (`gemini-3.6-flash`) retry up to 3 times with exponential backoff on transient errors (429, 502, 503, 504).
* **Graceful Degradation:** When optional fallback providers are configured (`AI_FALLBACK_PROVIDERS`), `ResilientLLMProvider` automatically falls back through OpenRouter, Hugging Face, or local Ollama.

## Scalability
* **Stateless Serverless Execution:** Every request to `/api/chat` is stateless, capable of scaling horizontally across Vercel serverless worker nodes.

## Accessibility
* **Semantic HTML & Contrast:** WCAG 2.1 AA compliant contrast ratios across dark and light UI modes, supporting keyboard navigation and screen readers.

---

# 6. Architectural Principles

The project MUST follow:

1. **Serverless V2 Native First (ADR-0007):** All production serving occurs inside Next.js 15 App Router serverless routes on Vercel.
2. **Zero Render Fallback in Production:** In production, requests MUST use native relative endpoints (`/api/*`). Render is strictly legacy.
3. **Golden Rule of Non-Inference (ADR-0009):** Never classify generic network, timeout, or DNS exceptions as `PAUSED`. Evidence must be explicit.
4. **Pure TypeScript Engine:** RAG retrieval algorithms (`TSVectorStore`, `SimpleTfIdf`) MUST remain in pure TypeScript without native binary C++ bindings.
5. **Provider-Agnostic AI Layer (ADR-0005 & ADR-0006):** AI interactions are mediated through abstract interfaces (`LLMProvider`, `EmbeddingProvider`) with centralized factory creation.
6. **World-Scope Context Isolation (WSCI):** Maintain strict boundaries between `frontend`, `backend`, and `infra`.
7. **Jidoka Quality Discipline:** No code is consolidated without passing the complete test suite and `npm run jidoka`.

The project MUST NOT:

1. **PROHIBITION 1:** Never execute RAG queries against legacy Render containers in production.
2. **PROHIBITION 2:** Never expose administrative tokens (`SUPABASE_MANAGEMENT_TOKEN`) to browser code.
3. **PROHIBITION 3:** Never classify courses, training, or certifications as "Software Projects" in RAG responses.

---

# 7. Technology Constraints

## Runtime
* **Node.js:** `>= 22.0.0`
* **Package Manager:** `npm@11.4.2` workspaces
* **Build Orchestration:** `turbo@2.10.8`

## Frameworks
* **Frontend / Serverless App:** Next.js `15.5.22` (App Router), React `19.1.0`
* **Styling & UI:** Tailwind CSS `3.4.17`, Framer Motion `12.23.12`, Lucide React, Radix UI Primitives
* **Backend (Offline Tooling):** Express `4.19.2`, LangChain Core `0.3.72`

## Database & Storage
* **Vector Index:** Pre-computed static JSON files (`docstore.json`, `vectors.json`, `manifest.json`)
* **Remote Persistent Bucket:** Supabase Storage (`faiss-index` bucket)
* **Management Control:** Supabase Management API v1 (`https://api.supabase.com/v1`)

## Infrastructure
* **Hosting Primary:** Vercel (Production deployment for Next.js App Router)
* **Hosting Legacy / Fallback:** Render.com (`ask-richter-backend` Web Service)

## External Services
* **Primary LLM & Embeddings:** Google GenAI API (`@google/genai` 2.17.1, `gemini-3.6-flash`, `gemini-embedding-2`)
* **Secondary / Fallback LLMs:** OpenRouter, Hugging Face, Local Ollama (`deepseek-r1:8b`)

---

# 8. Data Model

## Core Entities

* **`KnowledgeDocument`:** Source consolidated markdown documents representing career milestones (`CV-Consolidated.md`, `Experience-Consolidated.md`, `Projects-Consolidated.md`, `PoC-Challenges-SideProjects-Consolidated.md`).
* **`SemanticChunk`:** Atomic text units produced by the ingestion splitter containing `pageContent`, `metadata.source`, `metadata.section_header`, `metadata.project_name`, and `metadata.technologies`.
* **`VectorEntry`:** Mapping of document ID to 768-dimensional floating point array (`number[]`).
* **`IndexManifest`:** Verification manifest recording chunk counts, dimension (768), model name, and generation timestamps.
* **`SupabaseStatusResult`:** Operational status record containing `state` (`READY | PAUSED | WAKING | UNAVAILABLE | TIMEOUT | AUTH_ERROR | UNKNOWN`), `isReady: boolean`, `isPaused: boolean`, `reason: string`, and `checkedAt: string`.

## Data Ownership
* **Luis Fernando Richter (Author/Owner):** Owns all knowledge base source markdown files and credentials.

## Sensitive Data
* API keys, tokens, and credentials (`GEMINI_API_KEY`, `SUPABASE_MANAGEMENT_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `DB_ACCESS_TOKEN`) are strictly sensitive and managed via environment variables.

---

# 9. Security Model

## Authentication & Secrets
* Server-side environment variables strictly isolated from client bundles.
* Management token (`SUPABASE_MANAGEMENT_TOKEN`) resolved exclusively inside serverless handlers.
* Client-to-server traffic is restricted to internal Next.js API endpoints (`/api/*`).

## External Input Validation
* Queries sent to `POST /api/chat` are validated for type, empty strings, and maximum length.
* Structured system prompts enforce context isolation, explicitly instructing the model to reject prompt injection attempts.

---

# 10. Integration Contracts

## Primary Chat Endpoint (`POST /api/chat`)
* **Input Payload:** `{ messages?: Message[], message?: string, prompt?: string }`
* **Success Response (HTTP 200):** `{ answer: string }`
* **Error Response (HTTP 400/500):** `{ error: string }`

## Supabase Status Endpoint (`GET /api/supabase/status`)
* **Success Response (HTTP 200):**
  ```json
  {
    "state": "READY",
    "status": "ok",
    "isReady": true,
    "isPaused": false,
    "statusCode": 200,
    "reason": "READY: Supabase ativo...",
    "checkedAt": "2026-09-02T16:00:00.000Z"
  }
  ```

## Supabase Restore Endpoint (`POST /api/supabase/restore`)
* **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "state": "WAKING",
    "status": "restoring",
    "message": "Solicitação de restauração aceita com sucesso.",
    "checkedAt": "2026-09-02T16:00:00.000Z"
  }
  ```

---

# 11. Observability

* **Structured Console Logging:** Serverless endpoints emit formatted logs detailing query intent, latency, and status probe results.
* **Auditable Index Logs:** Re-indexing operations record immutable audit entries in `docs/INDEXING_LOG.md`.
* **Client Diagnostics:** Modal displays real-time countdown, polling attempt indices, and current operational states.

---

# 12. Quality Strategy

## Testing Matrix
* **Frontend Unit & Chaos Suite:** 65 automated tests across 8 suites (`apps/frontend/src/**/*.test.ts`) covering parity, routing invariants, M13 chaos verification, restore service, status classifier, and M15 multilingual alignment.
* **Backend Provider & Resilience Suite:** 19 automated tests across 3 suites (`apps/backend/src/**/*.test.ts`) covering `ProviderFactory`, `GeminiEmbeddingProvider` retry logic, and `ResilientLLMProvider` fallback chains.

## Definition of Done (DoD)
Tasks are not considered complete unless:
* [ ] Requirements and acceptance criteria are satisfied
* [ ] Relevant automated tests pass (`npm test --workspace=frontend`, `npm test --workspace=backend`)
* [ ] Unified Andon Cord verification succeeds (`npm run jidoka`) with exit code 0
* [ ] Regressions evaluated and eliminated
* [ ] Documentation synchronized (Canonical English `META_SPEC.md` and localized `docs/pt-br/META_SPEC.md`)

---

# 13. Architectural Decision Authority

The following decisions require explicit human approval:
* Modifying core architectural principles or altering the Serverless V2 topology.
* Adding new third-party cloud providers or external paid APIs.
* Changing database schemas or storage bucket lifecycle policies.
* Modifying the canonical `META_SPEC.md`.

---

# 14. Change Control

This document is the supreme technical authority of the project. Any proposed architectural changes must follow:
1. Formal ADR proposal in `docs/adr/`.
2. Explicit human review and approval.
3. Update to `META_SPEC.md` and `docs/pt-br/META_SPEC.md`.

---

# 15. Known Constraints

* **Static Serverless Vector Bounds:** Production instances do not recompute embeddings on the fly; they load bundled JSON assets.
* **Supabase Free-Tier Inactivity:** The Supabase project pauses after 7 days of inactivity, necessitating the unfreeze subsystem.
* **Google GenAI Free-Tier Rate Limits:** Subject to RPM limits, handled by exponential retry in `GeminiLLMProvider`.

---

# 16. Known Risks

| Risk | Probability | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| Supabase Dormancy (Pause) | High | Med | Automated probe + `SupabaseUnfreezeModal` with progressive backoff. |
| Google GenAI 503 Outages | Med | High | Bounded retries (3x) + fallback providers in `ResilientLLMProvider`. |
| Legacy Render URL in Bundle | Low | High | Runtime URL sanitizer + invariant tests in `routing.test.ts`. |
| Documentation & Code Drift | Med | Med | AI Engineering Framework v2.1 governance and discovery checkpoints. |

---

# 17. Open Questions & Specification Conflicts

* [x] **CONFLICT 1: Serverless V2 vs Render Backend:** RESOLVED. Real code runs Serverless V2 on Vercel (`apps/frontend/src/app/api/chat/route.ts`). Render is legacy fallback.
* [x] **CONFLICT 2: FAISS C++ vs Pure TS:** RESOLVED. Real production RAG runs pure TypeScript `TSVectorStore`.
* [x] **CONFLICT 3: Language Alignment:** RESOLVED. M15 multilingual response alignment adopted; output matches user question language.
* [ ] **QUESTION 1:** Should legacy `apps/backend` Express server be kept for local dev or retired once ingestion scripts are extracted into a shared package?
* [ ] **QUESTION 2:** Should default Turborepo starter apps (`apps/web`, `apps/docs`) be cleaned up to reduce monorepo noise?

---

# 18. Success Definition

The project is successful when:
* Recruiters and engineers receive immediate, verified, zero-hallucination responses regarding Luis Fernando Richter's experience.
* The application runs with 99.9% uptime on zero-cost free-tier infrastructure.
* The monorepo passes `npm run jidoka` on every change with zero regressions.

---

# 19. Change History

| Version | Date | Change | Approved By |
| :--- | :--- | :--- | :--- |
| 1.0.0 | 2026-08-05 | Initial constitution & legacy Express/FAISS spec | Luis Fernando Richter |
| 2.0.0 | 2026-08-27 | Serverless V2 cutover, TSVectorStore, Supabase resilience & M15 | Luis Fernando Richter |
| 2.1.0 | 2026-09-02 | AI Engineering Framework v2.1 discovery reconciliation | Luis Fernando Richter |
