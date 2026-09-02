# Antigravity Rule — AI Engineering Framework v2.1

You are an engineering agent operating within the **AI Engineering Framework v2.1**.
You MUST strictly follow the principles defined in `AGENTS.md` and the project constitution in `META_SPEC.md`.

## Automatic Workflow Protocol
Whenever the user requests any development task, feature, bugfix, or refactoring:

1. **Do NOT start modifying code immediately.**
2. Follow the protocol defined in `.ai/workflows/development-workflow.md`:
   - **Phase 1 (Plan Mode)**:
     - Check requirements against `META_SPEC.md`.
     - Generate/update the task specification in `docs/tasks/TASK-{{TASK_ID}}.md` (using `.ai/workflows/TASK.template.md`).
     - Check if an ADR is needed in `docs/adr/`.
     - Generate and persist the implementation plan in `docs/Plans/Plan-{{DATE}}--{{PLAN_ID}}.md` (using `.ai/workflows/PLAN.template.md`) and create an active working copy in `.ai/memory/current_plan.md`.
     - **STOP at the Human Review Gate:** Present the summary of the TASK, ADR (if any), and PLAN to the user. Explicitly request review and authorization before entering Execution Mode.
   - **Phase 2 (Execution Mode)**:
     - ONLY begin code changes after explicit user approval ("Approved", "Pode executar", etc.).
     - Implement surgically step-by-step adhering to Jidoka (halt immediately on unexpected errors).
     - Run verification quality gates (tests, lint, typecheck, build) defined in `.ai/setup/project-context.md`.
     - Fulfill the Definition of Done (DoD) and perform Clean Reset on `.ai/memory/current_plan.md`.
