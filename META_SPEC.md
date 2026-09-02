# META_SPEC — ask-richter

**Version:** 1.0.0
**Status:** Draft | Active | Deprecated
**Last Updated:** {{YYYY-MM-DD}}
**Owner:** {{OWNER}}

---

# 1. Project Identity

## 1.1 Name

`ask-richter`

## 1.2 One-Line Description

> {{DESCRIBE THE PROJECT IN ONE SENTENCE}}

## 1.3 Problem

{{WHAT PROBLEM DOES THIS PROJECT SOLVE?}}

## 1.4 Target Users

* {{USER / PERSONA 1}}
* {{USER / PERSONA 2}}

---

# 2. Vision

## 2.1 Vision Statement

{{WHAT SHOULD THIS SYSTEM BECOME?}}

## 2.2 Business / User Outcome

{{WHAT MEASURABLE OUTCOME SHOULD EXIST IF THIS PROJECT SUCCEEDS?}}

---

# 3. Scope

## 3.1 In Scope

* {{ITEM}}
* {{ITEM}}
* {{ITEM}}

## 3.2 Out of Scope

* {{ITEM}}
* {{ITEM}}
* {{ITEM}}

> Agents MUST NOT implement functionality listed as Out of Scope without explicit authorization.

---

# 4. Functional Requirements

### FR-001 — {{NAME}}

**Requirement:**

{{DESCRIPTION}}

**Acceptance Criteria:**

* [ ] {{CRITERION}}
* [ ] {{CRITERION}}

---

### FR-002 — {{NAME}}

**Requirement:**

{{DESCRIPTION}}

**Acceptance Criteria:**

* [ ] {{CRITERION}}
* [ ] {{CRITERION}}

---

# 5. Non-Functional Requirements

## Performance

{{PERFORMANCE REQUIREMENTS}}

## Security

{{SECURITY REQUIREMENTS}}

## Reliability

{{RELIABILITY REQUIREMENTS}}

## Scalability

{{SCALABILITY REQUIREMENTS}}

## Accessibility

{{ACCESSIBILITY REQUIREMENTS}}

## Compliance

{{LEGAL / REGULATORY / ORGANIZATIONAL REQUIREMENTS}}

---

# 6. Architectural Principles

The project MUST follow:

1. {{PRINCIPLE}}
2. {{PRINCIPLE}}
3. {{PRINCIPLE}}

The project MUST NOT:

1. {{PROHIBITION}}
2. {{PROHIBITION}}

---

# 7. Technology Constraints

## Runtime

{{LANGUAGE / RUNTIME}}

## Frameworks

{{FRAMEWORKS}}

## Database

{{DATABASE}}

## Infrastructure

{{INFRASTRUCTURE}}

## External Services

{{EXTERNAL SERVICES}}

> These are project constraints, not universal framework rules.

---

# 8. Data Model

## Core Entities

* {{ENTITY}}
* {{ENTITY}}

## Data Ownership

{{WHO OWNS EACH IMPORTANT DATA DOMAIN?}}

## Sensitive Data

{{WHAT DATA IS SENSITIVE AND HOW MUST IT BE PROTECTED?}}

---

# 9. Security Model

## Authentication

{{AUTHENTICATION STRATEGY}}

## Authorization

{{AUTHORIZATION STRATEGY}}

## Secrets

{{SECRET MANAGEMENT}}

## External Input

{{INPUT VALIDATION / TRUST BOUNDARIES}}

---

# 10. Integration Contracts

## {{SYSTEM / API}}

**Purpose:** {{PURPOSE}}

**Contract:** {{CONTRACT}}

**Failure Behavior:** {{FAILURE BEHAVIOR}}

---

# 11. Observability

The system should provide appropriate:

* Logging
* Metrics
* Tracing
* Error reporting
* Health checks

Specific requirements:

{{REQUIREMENTS}}

---

# 12. Quality Strategy

## Testing

{{TESTING STRATEGY}}

## Definition of Done

Tasks are not considered complete unless:

* [ ] Acceptance criteria satisfied
* [ ] Relevant tests pass
* [ ] Build/typecheck/lint validated when applicable
* [ ] Regression evaluated
* [ ] Diff reviewed
* [ ] Documentation updated when necessary

---

# 13. Architectural Decision Authority

The following decisions require explicit human approval:

* {{DECISION TYPE}}
* {{DECISION TYPE}}
* {{DECISION TYPE}}

---

# 14. Change Control

This META_SPEC may evolve.

However:

> No agent may modify this document silently in order to justify an implementation.

Changes must include:

1. Reason for change
2. Impact assessment
3. Updated version
4. Relevant ADR when appropriate
5. Explicit authorization

---

# 15. Known Constraints

* {{CONSTRAINT}}
* {{CONSTRAINT}}

---

# 16. Known Risks

| Risk   | Probability  | Impact       | Mitigation   |
| ------ | ------------ | ------------ | ------------ |
| {{RISK}} | Low/Med/High | Low/Med/High | {{MITIGATION}} |

---

# 17. Open Questions

* [ ] {{QUESTION}}
* [ ] {{QUESTION}}

Agents must not silently resolve questions that materially affect architecture, security, scope, or business behavior.

---

# 18. Success Definition

The project is successful when:

* {{MEASURABLE OUTCOME}}
* {{MEASURABLE OUTCOME}}
* {{MEASURABLE OUTCOME}}

---

# 19. Change History

| Version | Date   | Change                | Approved By |
| ------- | ------ | --------------------- | ----------- |
| 1.0.0   | 2026-09-02 | Initial specification | {{OWNER}}     |
