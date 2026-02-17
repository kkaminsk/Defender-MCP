# Proposal: Graceful Shutdown

## Summary
Add process signal handling for clean MCP server shutdown.

## Motivation
Unhandled termination signals can interrupt operations and produce abrupt process exits.

## Scope
- Handle `SIGINT` and `SIGTERM` in the entrypoint.
- Close server resources before process exit.
- Ensure shutdown path is idempotent.
