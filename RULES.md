# DynamicMenu — Development Rules

## 1. General

* Read `Memory.md` **FIRST**.
* Inspect existing code before modifying it.
* Understand existing architecture and patterns before introducing changes.
* Reuse existing patterns and components.
* Keep changes minimal and focused.
* Do not create unnecessary files.
* Do not duplicate logic.
* Do not over-engineer.
* Do not add dependencies without justification.
* Do not modify unrelated code.
* Preserve existing working behavior unless the requirement explicitly changes it.

## 2. TypeScript

* Use strict TypeScript.
* Avoid `any`.
* Avoid unnecessary type assertions.
* Explicitly type important boundaries.
* Keep domain types close to their domain.
* Prefer inferred types where inference is clear.
* Do not weaken type safety to make code compile.

## 3. Components

* Reuse existing components whenever possible.
* Create new components only when they provide clear reuse, isolation, or maintainability benefits.
* Keep components focused.
* Avoid giant components.
* Avoid excessive component fragmentation.
* Do not create wrappers that add no meaningful value.
* Keep business logic out of purely presentational components when practical.

## 4. State Management

* Keep state local when possible.
* Do not introduce global state without a clear requirement.
* Do not duplicate server state in client state unnecessarily.
* Separate server data from UI state.
* Use the existing state-management pattern before introducing a new one.
* Avoid multiple sources of truth.

## 5. Database

* Every tenant-owned record must have explicit tenant ownership.
* Database queries must enforce tenant isolation.
* Never trust client-supplied tenant ownership.
* Validate relationships server-side.
* Never allow cross-tenant resource access.
* Preserve historical order and transaction data.
* Do not mutate historical prices or transaction snapshots.
* Use transactions for operations that must be atomic.
* Enforce important invariants at the database or server layer where appropriate.

## 6. API

Protected requests must follow:

```text
Authenticate
    ↓
Resolve Tenant
    ↓
Authorize
    ↓
Validate
    ↓
Execute
    ↓
Respond
```

* Never skip authorization for tenant-owned resources.
* Never trust client-supplied roles, permissions, tenant IDs, ownership, prices, or sensitive status values.
* Validate authorization server-side.
* Use appropriate HTTP status codes.
* Return predictable API response structures.
* Do not expose sensitive internal errors.
* Do not expose database errors, stack traces, credentials, tokens, or internal implementation details.

## 7. Validation

Validate all untrusted input, including:

* Request bodies
* Query parameters
* URL parameters
* Cookies
* Headers
* Uploaded files
* Webhooks
* External API responses
* Third-party service data

Validation must occur at the appropriate server boundary.

Client-side validation improves UX but does not replace server-side validation.

## 8. Error Handling

* Fail clearly and predictably.
* Use appropriate error responses.
* Never silently swallow errors.
* Do not expose stack traces to users.
* Do not expose secrets or sensitive implementation details.
* Log useful server-side diagnostic information.
* Do not log passwords, tokens, API keys, or sensitive customer data unnecessarily.
* Handle expected errors explicitly.
* Preserve useful error context for debugging.

## 9. Security

* Never hardcode secrets.
* Never commit credentials.
* Never expose secrets to the frontend.
* Never trust client-side authorization.
* Prevent cross-tenant access.
* Enforce permissions server-side.
* Validate uploaded files.
* Sanitize or escape user-generated content where required.
* Follow secure authentication practices.
* Protect sensitive endpoints against unauthorized access.
* Do not weaken security controls to simplify development.
* Do not disable security checks without an explicit requirement and documented reason.

## 10. UI

* Follow `Design.md`.
* Reuse design-system components.
* Reuse existing styles and patterns.
* Maintain responsive behavior.
* Maintain keyboard accessibility.
* Use semantic HTML where appropriate.
* Provide appropriate loading, empty, success, and error states.
* Avoid unnecessary animations.
* Avoid inconsistent one-off styling.
* Do not introduce a new visual pattern when an existing pattern already solves the problem.

## 11. Performance

* Avoid unnecessary renders.
* Avoid unnecessary API requests.
* Avoid unnecessary database queries.
* Avoid unnecessarily large assets.
* Lazy-load where appropriate.
* Avoid premature optimization.
* Measure before making major performance changes.
* Prefer simple optimizations with measurable impact.
* Do not sacrifice correctness or maintainability for minor performance gains.

## 12. Refactoring

Before refactoring:

1. Use Graphify when useful.
2. Understand the dependency graph.
3. Identify affected consumers.
4. Identify related API, database, and UI dependencies.
5. Make the smallest safe change.
6. Verify the result.
7. Remove obsolete code.

Rules:

* Do not refactor unrelated areas.
* Do not replace working architecture without justification.
* Do not leave old and new implementations unnecessarily.
* Do not perform large rewrites when a targeted change is sufficient.
* Preserve existing behavior unless the refactor intentionally changes it.

## 13. Dependencies

Before adding a package:

1. Check existing dependencies.
2. Check whether native functionality is sufficient.
3. Check whether existing project utilities can solve the problem.
4. Check whether an existing dependency already provides the required functionality.
5. Add a dependency only when justified.

When adding a dependency, consider:

* Maintenance
* Bundle size
* Security
* Compatibility
* Long-term necessity

Do not add dependencies for trivial functionality.

## 14. AI Boundaries

AI must not:

* Invent requirements.
* Invent completed work.
* Invent architecture decisions.
* Assume missing requirements.
* Delete code without verification.
* Replace working architecture without justification.
* Change unrelated files.
* Add dependencies casually.
* Refactor unrelated areas.
* Claim tests passed when they were not run.
* Claim a feature works without verification.
* Assume a command succeeded without checking its output.

AI should:

* Inspect before modifying.
* Follow existing project patterns.
* Make the smallest reasonable change.
* Verify consequential changes.
* Preserve existing functionality.
* Clearly identify uncertainty.
* Ask before making consequential changes when requirements conflict or are materially ambiguous.

If requirements conflict, **ask before proceeding with consequential changes**.

## 15. Verification

After meaningful changes, perform the relevant checks:

* Run relevant tests.
* Run TypeScript type checking.
* Run linting.
* Run build checks when appropriate.
* Check affected user flows.
* Check API behavior when APIs were changed.
* Check database behavior when database logic was changed.
* Check tenant isolation for tenant-related changes.
* Check authorization when roles or permissions were changed.
* Check responsive behavior for significant UI changes.

Do not claim verification that was not actually performed.

## 16. Documentation

* Keep architecture documentation aligned with the implementation.
* Update `Memory.md` after meaningful architectural, structural, or project-state changes.
* Update relevant documentation when behavior or architecture materially changes.
* Do not document theoretical architecture as if it were implemented.
* Remove obsolete documentation when the underlying implementation is removed.

## 17. Change Discipline

Every change should follow:

```text
Understand
    ↓
Inspect
    ↓
Plan
    ↓
Modify
    ↓
Verify
    ↓
Clean Up
    ↓
Document
```

Prefer the smallest change that correctly satisfies the requirement.

**Correctness, security, tenant isolation, and maintainability take priority over speed of implementation.**
