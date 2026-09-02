# Project Context — ask-richter

## Current State

<!-- Describe the current state of the project. -->

## Current Milestone

<!-- Example: M1 — Initial Setup -->

## Current Focus

<!-- What is being worked on now? -->

## Repository Structure

<!-- Keep this concise. -->
Detected source directories: packages

## Technology Stack

- Node.js / JavaScript

## Architecture

<!-- High-level architecture only. -->

## Important Components

<!-- Components an agent should understand before modifying code. -->

## Important Commands

```bash
# Install
npm install

# Tests
npm test

# Lint
npm run lint

# Build
npm run build
```

## Environment Variables

List names only. Never put secrets here.

## External Dependencies

<!-- APIs, databases, services, providers. -->

## Current Constraints

<!-- Technical, business, infrastructure or compatibility constraints. -->

## Known Risks

<!-- Known risks that agents must consider. -->

## Important Decisions

See: docs/adr/

## Context Loading Order

Agents should normally load context in this order:

1. AGENTS.md
2. META_SPEC.md
3. .ai/setup/project-context.md
4. Relevant architecture documentation
5. Relevant ADRs
6. Current TASK / PLAN
7. Affected source code
8. Relevant tests

Do NOT load the entire repository unless necessary.
