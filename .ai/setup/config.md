# AI Runtime Configuration

## Provider

`ollama`

## Models

### Coding

`qwen2.5-coder:14b`

Primary model for:
- implementation
- refactoring
- tests
- code review
- repository exploration

### Reasoning

`deepseek-r1:8b`

Primary model for:
- architecture analysis
- complex reasoning
- debugging hypotheses
- plan review
- trade-off analysis

## Runtime

This project uses an adapter-based AI runtime.

The project specification MUST NOT depend directly on
a specific CLI, model vendor, or orchestration framework.

Current local runtime:

- Provider: Ollama
- Coding model: qwen2.5-coder:14b
- Reasoning model: deepseek-r1:8b

## Available Models

Run:

    ollama list

Expected local models may include:

    qwen2.5-coder:14b
    deepseek-r1:8b
