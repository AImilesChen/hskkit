# HSKKit Stage06 frontend handoff

## Status
- Stage06 design truth: **GO**
- Stage07 implementation: **NOT AUTHORIZED BY THIS PACKAGE**; requires a separate owner instruction.
- Production deployment/payment activation: not authorized.

## Source of truth
1. `metadata/canonical-manifest.json` — exactly 54 adopted official replacement Screens.
2. `html/` — official Stitch HTML exports.
3. `screenshots/` — official Stitch screenshots.
4. `metadata/design-system.json` — frozen tokens.
5. `source-inputs/` — PRD, pricing, compliance, and copy authorities.

## Implementation rules
- Implement only the canonical replacement Screen IDs; ignore `deprecated/` IDs.
- Preserve route/device/state/title mapping and frozen copy.
- Desktop and Mobile sources are paired by title/route and `device_type` in `metadata/screens.json`.
- HTML is a design truth/reference export, not production application source; frontend owns production DOM, accessibility, state logic, data binding, auth/payment behavior, build, and deployment.
- Planned/blocked entitlement states remain planned/blocked until separately authorized.
- Self-host fonts/icons; do not ship unreviewed remote CDN dependencies.
