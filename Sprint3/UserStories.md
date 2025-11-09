# Sprint 3 User Stories

> Each user story below is implemented and verified inside the current codebase.  
> Paths reference the Express application under `app/`.

## US-01 — Student Account Registration (Sprint 1 carry-over)
- **Status:** Complete, regression-tested in Sprint 3  
- **Goal:** As a prospective attendee, I want to create an account so I can access campus events.  
- **Implementation Highlights:** `routes/auth.js:59`, Prisma user creation in `lib/prisma`, session cookie helpers in `routes/auth.js:19`.
- **Acceptance Test Steps:**
  1. Visit `/register`.
  2. Submit valid email, password (≥8 chars), and first name.
  3. Confirm redirect to `/` with active session (`req.user` populated).
  4. Attempt duplicate email and observe conflict message “An account with that email already exists.”

## US-02 — Student Login & Profile Access (Sprint 2 carry-over)
- **Status:** Complete, regression-tested in Sprint 3  
- **Goal:** As a returning student, I want to authenticate and reach my profile dashboard.  
- **Implementation Highlights:** Login handler in `routes/auth.js:37`, profile guard in `routes/profile.js:9`.
- **Acceptance Test Steps:**
  1. Open `/login` and enter valid credentials.
  2. Confirm redirect to `/` and navbar switches to “My Profile”.
  3. Navigate to `/profile`; verify organizer request state renders.
  4. Submit organizer request and confirm pending state via query flag `?requested=1`.

## US-03 — Public Event Discovery & Filters
- **Status:** Completed in Sprint 3  
- **Goal:** As a student, I want to browse, filter, and sort upcoming events.  
- **Implementation Highlights:** Filtered query in `controllers/eventsController.js:35`; EJS grid `views/student/index.ejs` with Bootstrap UI; JSON support for API clients.
- **Acceptance Test Steps:**
  1. Navigate to `/events` and observe upcoming event cards.
  2. Apply search, date, category, and organization filters; confirm visible cards update.
  3. Change sort to “Title” and verify alphabetical ordering.
  4. Use “Reset” to clear filters and restore default list/meta.

## US-04 — Ticket Claiming & QR Retrieval
- **Status:** Completed in Sprint 3  
- **Goal:** As an authenticated student, I want to reserve a seat and obtain a QR ticket.  
- **Implementation Highlights:** `routes/tickets.ts:18` calls transactional `services/ticketService.ts:4`; ticket view in `views/student/show.ejs` and `views/student/ticket.ejs`.
- **Acceptance Test Steps:**
  1. Sign in as student and open a published event detail page.
  2. Click “Claim ticket” and verify success banner plus ticket summary.
  3. Open `/tickets/:id` to view QR preview and metadata.
  4. Download `/tickets/:id/qr?size=256` and scan the PNG to confirm token validity.

## US-05 — Organizer Event Management & Analytics
- **Status:** Completed in Sprint 3  
- **Goal:** As an approved organizer, I want to create, publish, monitor, and export events.  
- **Implementation Highlights:** Organizer routes in `routes/events.organizer.js`; analytics pipeline in `controllers/eventsController.js:368`; dashboard UI + modal behavior from `public/js/dashboard.ui.js`.
- **Acceptance Test Steps:**
  1. Log in as approved organizer and open `/organizers/:id/events`.
  2. Launch “New Event” modal, submit details, and confirm card creation.
  3. Toggle publish switch and verify status chips/utilization refresh.
  4. Download `attendees.csv` for a live event and inspect ticket rows.

## US-06 — Organizer Check-In via QR Tokens
- **Status:** Completed in Sprint 3  
- **Goal:** As an organizer, I want to validate attendee QR codes at the door.  
- **Implementation Highlights:** Scan endpoints in `dist/routes/organizerScan`; UI flow in `views/organizer/show.ejs` and `public/js/event-details.js`.
- **Acceptance Test Steps:**
  1. From an organizer event page, submit a valid QR token; expect “checked_in”.
  2. Re-submit same token; expect “already_used” notice with timestamp.
  3. Upload a PNG of the QR code; confirm server decodes and marks ticket used.
  4. Try invalid/foreign QR token; receive “not_found / invalid_qr” responses.

## US-07 — Administrative Moderation & Analytics
- **Status:** Completed in Sprint 3  
- **Goal:** As an administrator, I want to moderate events/organizers, manage organizations, and view analytics.  
- **Implementation Highlights:** Admin routers under `dist/routes/admin*`; business logic in `services/admin*` and `services/eventModerationService.ts`; JSON-only interface consumed by forthcoming admin UI.
- **Acceptance Test Steps:**
  1. Call `/admin/events?status=pending` as admin; approve and publish pending event.
  2. Reject another event with reason and confirm `published=false`.
  3. Approve/revoke organizer via `/admin/organizers/:id/{approved|revoked}` ensuring invalid transitions return 400.
  4. CRUD an organization, update roles via `/admin/users/:id/role`, and query `/admin/analytics` & `/admin/analytics/trends`.
