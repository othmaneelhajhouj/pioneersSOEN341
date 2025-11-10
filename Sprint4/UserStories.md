# Sprint 4 Product Backlog

| Story ID | User Story | Story Points | Priority | Risk | Tasks |
|----------|------------|--------------|----------|------|-------|
| US4-01 | As a student, I want to join an event waitlist and receive notifications when seats free up so I never miss a spot. | 5 | P1 | Medium — introduces async notifications and UX states. | Design waitlist schema (Prisma); extend `ticketService` for waitlist enqueue/dequeue; add UI states in `views/student/show.ejs` and `/my-events`; implement notification stub/logics; write acceptance scenarios. |
| US4-02 | As an administrator, I want a unified web console to consume the moderation and analytics APIs so I can manage the platform without REST clients. | 8 | P0 | High — multi-surface UI with several APIs and state handling. | Scaffold `/admin` EJS view; build dashboard JS modules (event moderation, organizer approvals, org/role editors); add charts for analytics & trends; hook into toast/loader patterns; produce user guide. |
| US4-03 | As an organizer, I want revenue-ready summaries so I can project payouts for paid events. | 3 | P1 | Medium — requires currency accuracy and new metrics. | Extend Prisma projections for price totals; surface revenue cards/charts in organizer dashboard; update CSV export with price columns; validate rounding/formatting; document finance notes. |
| US4-04 | As a student, I want one-click Google/Outlook calendar buttons so events land in my personal calendar automatically. | 2 | P2 | Low — relies on existing ICS metadata. | Add provider deep-link builders in `eventsController.js` response; update `student/show.ejs` with calendar buttons; document instructions; smoke test with both providers. |

> **Definition of Ready:** story has clear tasks, risk understood, owner placeholder assigned, and acceptance tests drafted ahead of Sprint 4 planning.
