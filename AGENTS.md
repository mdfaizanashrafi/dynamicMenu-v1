# AI Development Instructions

## 1. Start Here

Before doing any work:

1. Read `Memory.md` FIRST.
2. Read `PRD.md`.
3. Read `Architecture.md`.
4. Read `Rules.md`.
5. Read `Phases.md`.
6. Read `Design.md`.
7. Inspect the existing code before creating or modifying files.
8. Use Graphify to understand the codebase and dependencies when relevant.

Do not start coding before understanding the current project state.

## 2. Source of Truth

- `PRD.md` = product requirements
- `Architecture.md` = technical architecture
- `Rules.md` = development rules
- `Phases.md` = development roadmap
- `Design.md` = UI/UX system
- `Memory.md` = current project state
- `AGENTS.md` = AI operating instructions

When documents conflict, stop and identify the conflict instead of guessing.

## 3. Development Process

For every task:

1. Read `Memory.md`.
2. Identify the relevant phase.
3. Inspect existing implementation.
4. Use Graphify when dependency understanding is useful.
5. Plan the smallest correct change.
6. Implement.
7. Test the change.
8. Check for regressions, duplication, dead code and unnecessary dependencies.
9. Update `Memory.md`.

## 4. Codebase Rules

- Reuse existing code before creating new code.
- Do not create duplicate components or utilities.
- Do not create speculative files.
- Do not add unnecessary abstractions.
- Do not add dependencies without a clear reason.
- Do not rewrite working code without a reason.
- Keep implementation simple and maintainable.
- Remove obsolete code after refactoring.

## 5. Multi-Tenancy

Tenant isolation is a critical security requirement.

Every tenant-owned operation must verify:

- Authentication
- Authorization
- Tenant identity
- Tenant ownership

Never trust a client-provided tenant ID by itself.

Never allow one restaurant to access another restaurant's data.

Check tenant isolation in:

- Database queries
- APIs
- Authentication
- Authorization
- Storage
- Caching
- Background jobs
- Analytics
- Logs

## 6. Graphify

Use Graphify to:

- Understand repository structure
- Trace dependencies
- Find related code
- Analyze refactoring impact
- Identify unused/dead code
- Validate architectural changes

Do not perform large refactors without understanding their dependency impact.

## 7. Completion

A task is complete only when:

- Implementation works
- Relevant tests/checks pass
- No unnecessary code was introduced
- No obvious dead code remains
- Security implications were checked
- `Memory.md` is updated

## 8. Communication

Before major changes, briefly state:

- What will change
- Which files are affected
- Why

Do not ask unnecessary questions when the answer can be determined from the repository or project documents.

If requirements are genuinely ambiguous or conflicting, ask before making a consequential decision.