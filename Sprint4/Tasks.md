## Sprint 4 Milestone — “Campus Events Operational Readiness”
- **Target Date:** End of Sprint 4
- **Goal:** Ship admin console, waitlist notifications, enhanced revenue metrics, and calendar integrations in a release candidate build.

### Planned Tasks
| Task ID | Related Story | Description | Owner | Status |
|---------|---------------|-------------|-------|--------|
| T4-01 | US4-01 | Model waitlist entities, Prisma migrations, and service extensions. | Backend | ⬜️ Pending |
| T4-02 | US4-01 | Student-facing waitlist UI states & acceptance scenarios. | Frontend | ⬜️ Pending |
| T4-03 | US4-02 | Admin console scaffolding + shared layout under `/views/admin`. | Frontend | ⬜️ Pending |
| T4-04 | US4-02 | Integrate moderation/analytics APIs with fetch clients + state mgmt. | Frontend | ⬜️ Pending |
| T4-05 | US4-03 | Revenue projections in organizer dashboard & CSV exports. | Backend | ⬜️ Pending |
| T4-06 | US4-04 | Calendar provider deep links + documentation. | Frontend | ⬜️ Pending |
| T4-07 | All | Regression suite run + verification checklist before release. | Team | ⬜️ Pending |

### Dependencies & Notes
- Admin console depends on `dist/routes/admin*` APIs completed in Sprint 3 (no scope risk).
- Waitlist feature may require notification infrastructure; currently planned as email/log stub with scope to revisit.
- Regression testing includes repeating Sprint 3 acceptance steps plus new Sprint 4 coverage.
