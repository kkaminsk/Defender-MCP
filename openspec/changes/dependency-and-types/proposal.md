# Proposal: Dependency and Types

## Summary
Make runtime dependencies explicit and remove `any`-typed error handling in production code.

## Motivation
Transitive dependency reliance and `any` weaken reliability and static guarantees.

## Scope
- Add direct `zod` dependency.
- Replace `catch (err: any)` with `unknown` and guarded message extraction.
- Add typed payload interfaces for parsed PowerShell responses.
