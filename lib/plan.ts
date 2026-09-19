export type PlanTaskTemplate = {
  dayOffset: number;
  week: number;
  phase: string;
  dayInWeek: number;
  title: string;
  items: string[];
  doneWhen: string;
};

export type PlanDay = PlanTaskTemplate & {
  date: string;
};

export const DEFAULT_PLAN_START = '2026-09-18';

export function computeDateForOffset(startDate: string, offsetDays: number): string {
  const d = new Date(`${startDate}T12:00:00`);
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const planTemplates: PlanTaskTemplate[] = [
  {
    dayOffset: 0,
    week: 1,
    phase: "Setup and foundation",
    dayInWeek: 1,
    title: "Confirm database baseline",
    items: [
          "Install PostgreSQL on your laptop",
          "Create bookingpartner_dev",
          "Prepare .env.local with development values",
          "Run the reviewed Prisma migration",
          "Open pgAdmin and confirm existing tables"
    ],
    doneWhen: "No migration drift or unexpected data loss."
  },
  {
    dayOffset: 1,
    week: 1,
    phase: "Setup and foundation",
    dayInWeek: 2,
    title: "Inspect and connect Prisma",
    items: [
          "Review package.json, prisma/schema.prisma and prisma7.config.ts",
          "Check existing Prisma migrations, src/proxy.ts and Owner API routes",
          "Create Prisma 7-compatible client in src/backend/infrastructure/database/",
          "Test one safe query against bookingpartner_dev",
          "Record the Owner credential/session migration decision"
    ],
    doneWhen: "One server-side API can query development PostgreSQL safely."
  },
  {
    dayOffset: 2,
    week: 1,
    phase: "Setup and foundation",
    dayInWeek: 3,
    title: "Design owner authentication",
    items: [
          "Choose credential/session schema for owner email + password",
          "identify needed phone OTP and reset records",
          "Prepare migration proposal and authentication error codes",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Schema change checklist reviewed; no arbitrary auth tables added."
  },
  {
    dayOffset: 3,
    week: 1,
    phase: "Setup and foundation",
    dayInWeek: 4,
    title: "Build owner auth vertical slice",
    items: [
          "Implement thin owner-auth login/me/logout routes through auth service/repository",
          "use approved hashed credentials, secure cookies or chosen Auth.js session model",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Good/wrong credentials and logout work for local test owner."
  },
  {
    dayOffset: 4,
    week: 1,
    phase: "Setup and foundation",
    dayInWeek: 5,
    title: "Phone OTP and owner status",
    items: [
          "Implement development OTP challenge flow if provider is ready",
          "rate-limit and expire codes",
          "Apply pending/review/active/suspended policies",
          "Record blockers and commit the working change"
    ],
    doneWhen: "OTP reuse rejected; suspended owner cannot start new sales."
  },
  {
    dayOffset: 5,
    week: 1,
    phase: "Setup and foundation",
    dayInWeek: 6,
    title: "Core API consistency",
    items: [
          "Create response wrapper, AppError/handler, Zod validation, request ID and secret-safe logs",
          "keep src/proxy.ts aligned with Next.js version",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "400/401/403/409/500 are handled consistently."
  },
  {
    dayOffset: 6,
    week: 1,
    phase: "Setup and foundation",
    dayInWeek: 7,
    title: "First-week smoke tests",
    items: [
          "Run login/session/logout/status tests",
          "review existing bus routes and owner ID sourcing",
          "document blocker list"
    ],
    doneWhen: "No critical broken authentication or configuration flow."
  },
  {
    dayOffset: 7,
    week: 2,
    phase: "Authentication and users",
    dayInWeek: 1,
    title: "Owner onboarding API",
    items: [
          "Create pending owner with email/password and normalized phone",
          "do not allow public request to set approval or verification flags",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Duplicate identity and unsafe role/status fields rejected."
  },
  {
    dayOffset: 8,
    week: 2,
    phase: "Authentication and users",
    dayInWeek: 2,
    title: "Owner phone verification",
    items: [
          "Implement send/verify once-at-signup OTP with attempts, expiry, single-use storage",
          "define phone change re-verification",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Verified phone attached to correct pending owner."
  },
  {
    dayOffset: 9,
    week: 2,
    phase: "Authentication and users",
    dayInWeek: 3,
    title: "Verification documents",
    items: [
          "Allow pending owner profile and protected document upload",
          "under-review responds to admin requests only",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Owner cannot view or modify another owner documents."
  },
  {
    dayOffset: 10,
    week: 2,
    phase: "Authentication and users",
    dayInWeek: 4,
    title: "Customer registration baseline",
    items: [
          "Use existing customers.passwordHash",
          "validate and hash",
          "define separate customer sessions/verification only where required",
          "Record blockers and commit the working change"
    ],
    doneWhen: "New local customer signs in without owner access."
  },
  {
    dayOffset: 11,
    week: 2,
    phase: "Authentication and users",
    dayInWeek: 5,
    title: "Invite primary management user",
    items: [
          "Reuse member-owner connection",
          "create single-use invitation and password setup, not emailed temporary plaintext password",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Owner cannot invite into another operator."
  },
  {
    dayOffset: 12,
    week: 2,
    phase: "Authentication and users",
    dayInWeek: 6,
    title: "Sub-user invites and permissions",
    items: [
          "Primary may invite sub only with permission",
          "membership-scoped schedules/bookings/manual-booking flags, no financial access",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Wrong membership and expired invite denied."
  },
  {
    dayOffset: 13,
    week: 2,
    phase: "Authentication and users",
    dayInWeek: 7,
    title: "Account recovery test day",
    items: [
          "One-time reset tokens, session invalidation, owner approval tests and verification email/SMS failure handling",
          "Test normal, invalid and unauthorized access cases"
    ],
    doneWhen: "Auth flows pass with local test data and safe errors."
  },
  {
    dayOffset: 14,
    week: 3,
    phase: "Cities, routes, buses and layouts",
    dayInWeek: 1,
    title: "Cities and routes reads",
    items: [
          "Read existing cities, routes, route_stops and boarding_points, exposing only active public options",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Public dropdowns show real database records."
  },
  {
    dayOffset: 15,
    week: 3,
    phase: "Cities, routes, buses and layouts",
    dayInWeek: 2,
    title: "Dated trip search baseline",
    items: [
          "Validate origin, destination, departure date",
          "join schedules -> trips and return only bookable trips",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Search is based on the requested departure date."
  },
  {
    dayOffset: 16,
    week: 3,
    phase: "Cities, routes, buses and layouts",
    dayInWeek: 3,
    title: "Owner bus list and create",
    items: [
          "Refactor existing /api/v1/owner/buses",
          "derive ownerId from session and status gate",
          "validate bus fields",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Owner A cannot list or create under owner B."
  },
  {
    dayOffset: 17,
    week: 3,
    phase: "Cities, routes, buses and layouts",
    dayInWeek: 4,
    title: "Bus detail/edit",
    items: [
          "Preserve existing [id] route",
          "check busId and ownerId",
          "admin-only transfer process",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Changing URL bus ID does not disclose other owner data."
  },
  {
    dayOffset: 18,
    week: 3,
    phase: "Cities, routes, buses and layouts",
    dayInWeek: 5,
    title: "Bus compliance and photos",
    items: [
          "Validate protected document upload, permissions and operator visibility",
          "keep records in existing tables",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Unsupported files and cross-owner updates rejected."
  },
  {
    dayOffset: 19,
    week: 3,
    phase: "Cities, routes, buses and layouts",
    dayInWeek: 6,
    title: "Seat layout versioning",
    items: [
          "Use bus_layouts and bus_layout_slots, preserve used-layout immutability",
          "create new layout version when necessary",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Reopen layouts without changing historical trip seats."
  },
  {
    dayOffset: 20,
    week: 3,
    phase: "Cities, routes, buses and layouts",
    dayInWeek: 7,
    title: "Bus workflow test",
    items: [
          "Test normalized duplicate plate rule if migration approved, approval flags, active layout and mixed owner accounts",
          "Test normal, invalid and unauthorized access cases"
    ],
    doneWhen: "Owner CRUD/layout/ownership and constraint tests pass."
  },
  {
    dayOffset: 21,
    week: 4,
    phase: "Schedules and dated trips",
    dayInWeek: 1,
    title: "Create schedule and trip",
    items: [
          "POST /api/v1/owner/schedules",
          "check active owner, approved bus, route/time/fare",
          "generate dated trip and trip_seats from layout",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Each dated trip has correct sellable seat inventory."
  },
  {
    dayOffset: 22,
    week: 4,
    phase: "Schedules and dated trips",
    dayInWeek: 2,
    title: "List/filter/detail",
    items: [
          "Return owner-only schedules/trips, route/date/status filters",
          "availability counted from trip_seats",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "No cross-operator rows; count matches PostgreSQL."
  },
  {
    dayOffset: 23,
    week: 4,
    phase: "Schedules and dated trips",
    dayInWeek: 3,
    title: "Repeat trips",
    items: [
          "Create dated trips for daily/weekly repeat request",
          "use schedule_repeat_groups as defined, skip duplicates in one transaction",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Correct dates and unique trip seat inventories."
  },
  {
    dayOffset: 24,
    week: 4,
    phase: "Schedules and dated trips",
    dayInWeek: 4,
    title: "Schedule conflict detection",
    items: [
          "Detect same bus overlapping departures on a date, including edits",
          "block per approved rule",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "No time clashes silently committed."
  },
  {
    dayOffset: 25,
    week: 4,
    phase: "Schedules and dated trips",
    dayInWeek: 5,
    title: "Update time and crew",
    items: [
          "Authorize future trip changes",
          "verify assigned crew and bus belong to operator",
          "record trip_status_changes",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Affected passengers enumerated for SMS."
  },
  {
    dayOffset: 26,
    week: 4,
    phase: "Schedules and dated trips",
    dayInWeek: 6,
    title: "Cancel trip safely",
    items: [
          "Stop sale, apply owner/admin case rule for existing bookings",
          "start PayHere original-method refund or recorded operator cash refund",
          "No wallet",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Booked and unbooked cases leave valid final states."
  },
  {
    dayOffset: 27,
    week: 4,
    phase: "Schedules and dated trips",
    dayInWeek: 7,
    title: "Passenger manifest PDF",
    items: [
          "Owner-only per-trip PDF with permitted passenger/seat/boarding fields",
          "omit unnecessary PII",
          "Test normal, invalid and unauthorized access cases"
    ],
    doneWhen: "Unauthorized owner denied; zero and many passengers render."
  },
  {
    dayOffset: 28,
    week: 5,
    phase: "Seat holding and polling",
    dayInWeek: 1,
    title: "Atomic seat hold",
    items: [
          "POST /api/v1/seats/hold checks trip and seat",
          "DB conditional update wins for one holder only",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Concurrent clients cannot both acquire one seat."
  },
  {
    dayOffset: 29,
    week: 5,
    phase: "Seat holding and polling",
    dayInWeek: 2,
    title: "Hold extension once",
    items: [
          "After PayHere redirect step, allow a single extension up to 15 minutes total",
          "record extension usage in approved schema",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Second extension and invalid holder denied."
  },
  {
    dayOffset: 30,
    week: 5,
    phase: "Seat holding and polling",
    dayInWeek: 3,
    title: "Release hold",
    items: [
          "Release only the holder or authorized cleanup",
          "confirmed bookings are never released by hold endpoint",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Repeat release is safe."
  },
  {
    dayOffset: 31,
    week: 5,
    phase: "Seat holding and polling",
    dayInWeek: 4,
    title: "Expiry cleanup",
    items: [
          "Cron handles expiresAt <= database now",
          "expire related pending_payment record coherently before seat becomes sellable",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "No active pending booking blocks reclaimed seat."
  },
  {
    dayOffset: 32,
    week: 5,
    phase: "Seat holding and polling",
    dayInWeek: 5,
    title: "Seat-map read API",
    items: [
          "GET /api/v1/trips/[tripId]/seats",
          "return current safe status and treat expired hold accurately",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Opening map returns correct authoritative state."
  },
  {
    dayOffset: 33,
    week: 5,
    phase: "Seat holding and polling",
    dayInWeek: 6,
    title: "Polling UI integration",
    items: [
          "Poll while seat map visible",
          "slow/stop in background",
          "refetch after local hold/release",
          "no Pusher"
    ],
    doneWhen: "Two tabs converge without refresh."
  },
  {
    dayOffset: 34,
    week: 5,
    phase: "Seat holding and polling",
    dayInWeek: 7,
    title: "Race and recovery tests",
    items: [
          "Test simultaneous holds, expiry, payment redirect, disconnected tab, cron rerun and late callbacks",
          "Test normal, invalid and unauthorized access cases"
    ],
    doneWhen: "Only one valid active claimant per trip seat."
  },
  {
    dayOffset: 35,
    week: 6,
    phase: "Payments and booking confirmation",
    dayInWeek: 1,
    title: "Pending booking endpoint",
    items: [
          "POST /api/v1/bookings with frozen price/policy and owner/actor provenance",
          "request idempotency key",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "One request cannot create duplicate pending bookings."
  },
  {
    dayOffset: 36,
    week: 6,
    phase: "Payments and booking confirmation",
    dayInWeek: 2,
    title: "Payment attempt and gateway",
    items: [
          "Record gateway payment attempt with booking, amount, currency, status",
          "generate PayHere request server-side",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Secret never reaches browser."
  },
  {
    dayOffset: 37,
    week: 6,
    phase: "Payments and booking confirmation",
    dayInWeek: 3,
    title: "Verified webhook",
    items: [
          "Verify PayHere server callback, amount, currency, booking and provider reference",
          "store deduped webhook event",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Invalid, mismatched and duplicate callbacks safe."
  },
  {
    dayOffset: 38,
    week: 6,
    phase: "Payments and booking confirmation",
    dayInWeek: 4,
    title: "Confirmation and ledger",
    items: [
          "In one DB transaction confirm booking/seat, record balanced ledger entries and payout liability",
          "notify after commit",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "One financial posting per successful attempt."
  },
  {
    dayOffset: 39,
    week: 6,
    phase: "Payments and booking confirmation",
    dayInWeek: 5,
    title: "Late-payment and reconciliation",
    items: [
          "If hold expired and seat reallocated, record exception and initiate verified refund-to-source",
          "compare gateway records daily",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "No late paid booking steals another seat."
  },
  {
    dayOffset: 40,
    week: 6,
    phase: "Payments and booking confirmation",
    dayInWeek: 6,
    title: "Booking details and cancellation",
    items: [
          "Customer-only list/detail",
          "snapshot policy for eligibility",
          "admin handles PayHere refund",
          "counter cash refund recorded"
    ],
    doneWhen: "No wallet credit; actual method and state visible."
  },
  {
    dayOffset: 41,
    week: 6,
    phase: "Payments and booking confirmation",
    dayInWeek: 7,
    title: "Ticket and payment tests",
    items: [
          "PDF/QR ticket authorized",
          "test success/failure/duplicate/partial refund feasibility in merchant sandbox",
          "Test normal, invalid and unauthorized access cases"
    ],
    doneWhen: "No critical mismatch among ticket, seat, payment, ledger."
  },
  {
    dayOffset: 42,
    week: 7,
    phase: "Owner earnings, management and settings",
    dayInWeek: 1,
    title: "Owner earnings summary",
    items: [
          "GET /api/v1/owner/earnings uses paid eligible bookings and ledger/settlement states by trip",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Amounts match audited fixtures."
  },
  {
    dayOffset: 43,
    week: 7,
    phase: "Owner earnings, management and settings",
    dayInWeek: 2,
    title: "Payout breakdown",
    items: [
          "GET /api/v1/owner/payouts",
          "group pending, held, paid with ownerId restrictions",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Owner A never views Owner B payments."
  },
  {
    dayOffset: 44,
    week: 7,
    phase: "Owner earnings, management and settings",
    dayInWeek: 3,
    title: "Management list and invite UI",
    items: [
          "Complete owner/primary invitation screens and single-use activation already designed in Week 2",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Member only sees own operator membership."
  },
  {
    dayOffset: 45,
    week: 7,
    phase: "Owner earnings, management and settings",
    dayInWeek: 4,
    title: "Permissions and assignment",
    items: [
          "Enforce operator-scoped flags",
          "deactivate member and revoke sessions",
          "crew-to-bus same-owner checks",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Wrong membership cannot create manual booking."
  },
  {
    dayOffset: 46,
    week: 7,
    phase: "Owner earnings, management and settings",
    dayInWeek: 5,
    title: "Company and bank settings",
    items: [
          "Update profile",
          "bank-change requests require re-auth/admin approval",
          "mask bank details",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Previous active bank history preserved."
  },
  {
    dayOffset: 47,
    week: 7,
    phase: "Owner earnings, management and settings",
    dayInWeek: 6,
    title: "Policy and notifications",
    items: [
          "Owner edits allowed cancellation and alert settings",
          "snapshots of past bookings remain unchanged",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Existing booking refund terms not overwritten."
  },
  {
    dayOffset: 48,
    week: 7,
    phase: "Owner earnings, management and settings",
    dayInWeek: 7,
    title: "Manual counter booking",
    items: [
          "Authorized owner/manager creates cash booking",
          "LKR 100 platform fee per approved breakdown",
          "no fake PayHere attempt"
    ],
    doneWhen: "Cash receivable and seat ledger entry match booking total."
  },
  {
    dayOffset: 49,
    week: 8,
    phase: "Admin owner and financial APIs",
    dayInWeek: 1,
    title: "Owner review queue",
    items: [
          "Paginated /api/v1/admin/owners with pending, review, active, suspended and rejected states",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Admin authentication/permission required."
  },
  {
    dayOffset: 50,
    week: 8,
    phase: "Admin owner and financial APIs",
    dayInWeek: 2,
    title: "Owner approval actions",
    items: [
          "Approve/reject/suspend and record audit",
          "explicitly decide existing-booking action per affected trip",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Suspension never silently cancels unrelated travel."
  },
  {
    dayOffset: 51,
    week: 8,
    phase: "Admin owner and financial APIs",
    dayInWeek: 3,
    title: "Bus verification",
    items: [
          "Review compliance docs/layout",
          "approve or return for correction",
          "only eligible buses show in search",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Owner cannot approve own bus."
  },
  {
    dayOffset: 52,
    week: 8,
    phase: "Admin owner and financial APIs",
    dayInWeek: 4,
    title: "Financial release flow",
    items: [
          "List settlement batches, payout references and ledger evidence",
          "approve/withhold with reason",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "No double payout on retry."
  },
  {
    dayOffset: 53,
    week: 8,
    phase: "Admin owner and financial APIs",
    dayInWeek: 5,
    title: "Refund and disputes queue",
    items: [
          "Review PayHere-to-source and cash operator refunds with proofs",
          "audit each decision",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Operator/customer get only permitted refund status."
  },
  {
    dayOffset: 54,
    week: 8,
    phase: "Admin owner and financial APIs",
    dayInWeek: 6,
    title: "Reports and support",
    items: [
          "List/assign/reply reports and owner verification queries, preserving history",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Staff cannot read unrelated private material."
  },
  {
    dayOffset: 55,
    week: 8,
    phase: "Admin owner and financial APIs",
    dayInWeek: 7,
    title: "Admin analytics test",
    items: [
          "Bookings/day, routes, reconciled revenue and held liability",
          "date filtering and pagination",
          "Test normal, invalid and unauthorized access cases"
    ],
    doneWhen: "Numbers match sample financial journal."
  },
  {
    dayOffset: 56,
    week: 9,
    phase: "Management, transfers, reviews, notifications",
    dayInWeek: 1,
    title: "Management schedule reads",
    items: [
          "Primary/sub-user can view only membership-linked operator schedules and permitted routes",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Role alone never grants cross-owner access."
  },
  {
    dayOffset: 57,
    week: 9,
    phase: "Management, transfers, reviews, notifications",
    dayInWeek: 2,
    title: "Management manual booking",
    items: [
          "Allow with explicit manual_booking flag",
          "reuse atomic seat and cash accounting path",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Cannot skip fee, authorizations or ledger."
  },
  {
    dayOffset: 58,
    week: 9,
    phase: "Management, transfers, reviews, notifications",
    dayInWeek: 3,
    title: "Transfer initiation",
    items: [
          "Define transfer code/token life cycle, ownership and confirmed-booking eligibility",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Token is one-time and short-lived."
  },
  {
    dayOffset: 59,
    week: 9,
    phase: "Management, transfers, reviews, notifications",
    dayInWeek: 4,
    title: "Transfer accept/expiry",
    items: [
          "Accept/decline safely and expire after policy-defined period",
          "record provenance and notifications",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Double acceptance and stale token denied."
  },
  {
    dayOffset: 60,
    week: 9,
    phase: "Management, transfers, reviews, notifications",
    dayInWeek: 5,
    title: "Post-trip review create",
    items: [
          "Allow eligible passengers after travel, validate rating and owner reply boundaries",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "No arbitrary review of untraveled trip."
  },
  {
    dayOffset: 61,
    week: 9,
    phase: "Management, transfers, reviews, notifications",
    dayInWeek: 6,
    title: "Review reads and rating",
    items: [
          "Bus/owner rating from permitted reviews",
          "return public fields only",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Moderation state respected."
  },
  {
    dayOffset: 62,
    week: 9,
    phase: "Management, transfers, reviews, notifications",
    dayInWeek: 7,
    title: "Notification verification",
    items: [
          "SMS OTP/booking/refund/trip changes",
          "email receipts/approval/payout",
          "polling for seat map"
    ],
    doneWhen: "Retries do not generate duplicate sends."
  },
  {
    dayOffset: 63,
    week: 10,
    phase: "Security, concurrency and end-to-end testing",
    dayInWeek: 1,
    title: "API checklist",
    items: [
          "List routes and test success, 400, 401, 403, 404, 409 and 500",
          "request IDs",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Failures never leak credentials or stack traces."
  },
  {
    dayOffset: 64,
    week: 10,
    phase: "Security, concurrency and end-to-end testing",
    dayInWeek: 2,
    title: "Ownership/IDOR tests",
    items: [
          "Owner, manager, admin, customer and cross-operator access to bookings, buses and bank data",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Every wrong actor denied."
  },
  {
    dayOffset: 65,
    week: 10,
    phase: "Security, concurrency and end-to-end testing",
    dayInWeek: 3,
    title: "PayHere sandbox cases",
    items: [
          "Verify valid, failed, duplicate, late, mismatched amount, refund and unsupported partial refund case",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "No duplicate journal posting."
  },
  {
    dayOffset: 66,
    week: 10,
    phase: "Security, concurrency and end-to-end testing",
    dayInWeek: 4,
    title: "Seat/load tests",
    items: [
          "Race acquisition, cron replay, lazy expiry, time change and cancellation",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "One final valid trip seat state."
  },
  {
    dayOffset: 67,
    week: 10,
    phase: "Security, concurrency and end-to-end testing",
    dayInWeek: 5,
    title: "Frontend owner integration",
    items: [
          "Remove owner mock data screen by screen",
          "test real loading, empty and error states",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Owner UI uses actual API contracts."
  },
  {
    dayOffset: 68,
    week: 10,
    phase: "Security, concurrency and end-to-end testing",
    dayInWeek: 6,
    title: "Customer/admin integration",
    items: [
          "Connect booking confirmation, payouts, admin approval, refund status and notifications",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "One shared source of truth."
  },
  {
    dayOffset: 69,
    week: 10,
    phase: "Security, concurrency and end-to-end testing",
    dayInWeek: 7,
    title: "Full journey / go-no-go",
    items: [
          "Run owner signup -> approval -> bus -> trip -> search -> hold -> pay -> ticket -> refund",
          "Test normal, invalid and unauthorized access cases"
    ],
    doneWhen: "All critical checks pass or launch blocked."
  },
  {
    dayOffset: 70,
    week: 11,
    phase: "Production readiness and deployment",
    dayInWeek: 1,
    title: "Repo and CI",
    items: [
          "Protect main, add tests/build pipeline and deployment review",
          "do not commit secret files",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Clean CI and reproducible build."
  },
  {
    dayOffset: 71,
    week: 11,
    phase: "Production readiness and deployment",
    dayInWeek: 2,
    title: "Production DB provision",
    items: [
          "Create isolated managed PostgreSQL, backups and restricted credentials",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "No dev/prod data mixing."
  },
  {
    dayOffset: 72,
    week: 11,
    phase: "Production readiness and deployment",
    dayInWeek: 3,
    title: "Migration deployment rehearsal",
    items: [
          "Restore sample/staging backup and run committed migrations using deploy workflow",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Constraints/functions/triggers retained."
  },
  {
    dayOffset: 73,
    week: 11,
    phase: "Production readiness and deployment",
    dayInWeek: 4,
    title: "Production secrets",
    items: [
          "Configure hosting environment with DB, session, OTP, SMS/email, PayHere and cron keys",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Secrets only on server."
  },
  {
    dayOffset: 74,
    week: 11,
    phase: "Production readiness and deployment",
    dayInWeek: 5,
    title: "Provider callbacks and jobs",
    items: [
          "Set correct production webhook URL, verify callback, polling, refund and reconciliation jobs",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Duplicate deliveries safe."
  },
  {
    dayOffset: 75,
    week: 11,
    phase: "Production readiness and deployment",
    dayInWeek: 6,
    title: "Staging security test",
    items: [
          "Test actual HTTPS, owner states, cron authorization and payment flow from Sri Lanka mobile network",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "No critical public-data exposure."
  },
  {
    dayOffset: 76,
    week: 11,
    phase: "Production readiness and deployment",
    dayInWeek: 7,
    title: "Operational runbook",
    items: [
          "Practice restore, reconciliation incident, delayed callback, operator suspension and rollback",
          "Test normal, invalid and unauthorized access cases"
    ],
    doneWhen: "Named response and recovery procedure."
  },
  {
    dayOffset: 77,
    week: 12,
    phase: "Operator onboarding and conditional soft launch",
    dayInWeek: 1,
    title: "First operator preparation",
    items: [
          "Prepare company, phone verification, owner approval, approved fleet, routes and valid dated trips",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "All artifacts match production DB."
  },
  {
    dayOffset: 78,
    week: 12,
    phase: "Operator onboarding and conditional soft launch",
    dayInWeek: 2,
    title: "Operator walkthrough",
    items: [
          "Supervised owner/management actions, bus edit, manual booking, payout view and access checks",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Only own data visible."
  },
  {
    dayOffset: 79,
    week: 12,
    phase: "Operator onboarding and conditional soft launch",
    dayInWeek: 3,
    title: "Controlled real-money pilot",
    items: [
          "With permission and oversight, verify PayHere payment, booking, seat, ledger, ticket and SMS",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Real money fully reconciled."
  },
  {
    dayOffset: 80,
    week: 12,
    phase: "Operator onboarding and conditional soft launch",
    dayInWeek: 4,
    title: "Original-method refund pilot",
    items: [
          "Test supported online refund and recorded counter refund with agreed policy",
          "validate owner/admin visibility",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "Refund outcome equals journal."
  },
  {
    dayOffset: 81,
    week: 12,
    phase: "Operator onboarding and conditional soft launch",
    dayInWeek: 5,
    title: "Incident correction",
    items: [
          "Resolve production-only bugs",
          "run critical flow again after fixes",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "No unresolved critical issue."
  },
  {
    dayOffset: 82,
    week: 12,
    phase: "Operator onboarding and conditional soft launch",
    dayInWeek: 6,
    title: "Small operator cohort",
    items: [
          "Onboard 2-3 approved operators",
          "verify independent permissions and seat states",
          "Test normal, invalid and unauthorized access cases",
          "Record blockers and commit the working change"
    ],
    doneWhen: "No cross-operator leakage."
  },
  {
    dayOffset: 83,
    week: 12,
    phase: "Operator onboarding and conditional soft launch",
    dayInWeek: 7,
    title: "Launch readiness gate",
    items: [
          "Review backups, owner rules, seat races, payments, refunds, reconciliation, security and operator support",
          "Test normal, invalid and unauthorized access cases"
    ],
    doneWhen: "Launch only if gates pass; date may move."
  },
];

export function createPlan(startDate: string = DEFAULT_PLAN_START): PlanDay[] {
  return planTemplates.map((template, idx) => {
    const offset = typeof template.dayOffset === 'number' ? template.dayOffset : idx;
    return {
      ...template,
      dayOffset: offset,
      date: computeDateForOffset(startDate, offset),
    };
  });
}

export const plan: PlanDay[] = createPlan(DEFAULT_PLAN_START);
export const PLAN_START: string = plan[0]?.date || DEFAULT_PLAN_START;
export const PLAN_END: string = plan[plan.length - 1]?.date || DEFAULT_PLAN_START;

export type TaskDetail = {
  dayDate: string;
  dayTitle: string;
  itemTitle: string;
  itemIndex: number;
  phase: string;
  what: string;
  why: string;
  how: string[];
  doneWhen: string;
  dependencies: string;
  nextAction: string;
};

const PHASE_WHY_MAP: Record<string, string> = {
  'Setup and foundation': 'Foundational infrastructure required before building auth, bus models, and payment flows.',
  'Authentication and users': 'Required before owner and customer endpoints can be authorized and scoped.',
  'Cities, routes, buses and layouts': 'Required for route search and schedule seat inventory creation.',
  'Schedules and dated trips': 'Prerequisite for seat holding, price calculations, and booking reservations.',
  'Seat holding and polling': 'Critical for preventing concurrent double-bookings via atomic Redis holds and polling.',
  'Payments and booking confirmation': 'Core revenue transaction engine; connects seat allocation to PayHere payment and confirmation notifications.',
  'Owner earnings, management and settings': 'Required for bus operator self-service management, fleet allocation, and bank payout tracking.',
  'Admin owner and financial APIs': 'Required for platform governance, owner verification, commission monitoring, and audit security.',
  'Management, transfers, reviews, notifications': 'Ensures customer booking management, seat transfers, verified reviews, and transactional notifications.',
  'Security, concurrency and end-to-end testing': 'Validates system under high concurrent ticket rush traffic and enforces OWASP defenses.',
  'Production readiness and deployment': 'Hardens platform with environment secrets, SSL, CDN caching, and database backup.',
  'Operator onboarding and conditional soft launch': 'Final rollout with real fleet operators and monitoring before full public release.',
  // Legacy aliases
  'Setup & Foundation': 'Foundational infrastructure required before building auth, bus models, and payment flows.',
  'Authentication & Users': 'Required before owner and customer endpoints can be authorized and scoped.',
  'Cities, Routes & Buses': 'Required for route search and schedule seat inventory creation.',
  'Schedules': 'Prerequisite for seat holding, price calculations, and booking reservations.',
  'Seat Locking & Realtime': 'Critical for preventing concurrent double-bookings via atomic Redis holds and polling.',
  'Payments & Bookings': 'Core revenue transaction engine; connects seat allocation to PayHere payment.',
  'Owner Operations': 'Required for bus operator self-service management, fleet allocation, and bank payout tracking.',
  'Admin APIs': 'Required for platform governance, owner verification, and audit security.',
  'Mobile API Polish': 'Ensures high-speed, reliable payloads and notifications.',
  'Production Deployment': 'Hardens platform with environment secrets, SSL, CDN caching, and database backup.',
  'Security & Load Testing': 'Validates system under high concurrent ticket rush traffic and enforces OWASP defenses.',
  'Pilot & Soft Launch': 'Final rollout with real fleet operators and monitoring before full public release.',
};

export function getTaskDetail(day: PlanDay, itemIndex: number = 0): TaskDetail {
  const itemTitle = day.items[itemIndex] || day.title;
  const why = PHASE_WHY_MAP[day.phase] || 'Critical milestone for project completion and architectural integrity.';
  
  return {
    dayDate: day.date,
    dayTitle: day.title,
    itemTitle,
    itemIndex,
    phase: day.phase,
    what: `Implement ${itemTitle}. This is part of the "${day.title}" deliverable in ${day.phase}.`,
    why,
    how: day.items,
    doneWhen: day.doneWhen,
    dependencies: `Prerequisite for downstream ${day.phase} milestones and subsequent sprint integration.`,
    nextAction: `Execute: ${itemTitle}`,
  };
}

export type WhatsAppReportData = {
  date: string;
  completedTasks: string[];
  pendingTasks: string[];
  blockedTasks: string[];
  tomorrowTasks: string[];
};

export function formatWhatsAppReport(data: WhatsAppReportData): string {
  const total = data.completedTasks.length + data.pendingTasks.length;
  const completedCount = data.completedTasks.length;

  let text = `[Developer Progress]\n`;
  text += `Today: ${completedCount}/${total} completed\n\n`;

  if (data.completedTasks.length > 0) {
    text += `Completed:\n`;
    text += data.completedTasks.map((t) => `• ${t}`).join('\n') + `\n\n`;
  } else {
    text += `Completed:\n• None today yet\n\n`;
  }

  if (data.pendingTasks.length > 0) {
    text += `Pending:\n`;
    text += data.pendingTasks.map((t) => `• ${t}`).join('\n') + `\n\n`;
  }

  if (data.blockedTasks.length > 0) {
    text += `Blocked:\n`;
    text += data.blockedTasks.map((t) => `• ${t}`).join('\n') + `\n\n`;
  }

  if (data.tomorrowTasks.length > 0) {
    text += `Tomorrow:\n`;
    text += data.tomorrowTasks.map((t) => `• ${t}`).join('\n');
  }

  return text.trim();
}

export function formatSlackReport(data: WhatsAppReportData): string {
  const total = data.completedTasks.length + data.pendingTasks.length;
  const completedCount = data.completedTasks.length;

  let text = `*Developer Standup Progress*\n`;
  text += `> *Today:* ${completedCount}/${total} tasks completed\n\n`;

  if (data.completedTasks.length > 0) {
    text += `*Completed:*\n`;
    text += data.completedTasks.map((t) => `• ${t}`).join('\n') + `\n\n`;
  } else {
    text += `*Completed:*\n• None today yet\n\n`;
  }

  if (data.pendingTasks.length > 0) {
    text += `*Pending:*\n`;
    text += data.pendingTasks.map((t) => `• ${t}`).join('\n') + `\n\n`;
  }

  if (data.blockedTasks.length > 0) {
    text += `*Blocked:*\n`;
    text += data.blockedTasks.map((t) => `• ${t}`).join('\n') + `\n\n`;
  }

  if (data.tomorrowTasks.length > 0) {
    text += `*Tomorrow:*\n`;
    text += data.tomorrowTasks.map((t) => `• ${t}`).join('\n');
  }

  return text.trim();
}

export type MissedDayItem = {
  index: number;
  item: string;
  itemKey: string;
  override?: import('./storage').TaskOverride;
  reason?: import('./storage').TaskReason;
};

export type MissedDaySummary = {
  date: string;
  day: PlanDay;
  missedTasks: MissedDayItem[];
  completedTasks: string[];
  blockedText?: string;
  noteText?: string;
  whyItMatters: string;
  dependencies: string;
  nextAction: string;
};

export function getMissedDays(
  currentDate: string,
  states: import('./storage').ItemStates,
  taskOverrides: import('./storage').TaskOverridesMap = {},
  endOfDayMap: import('./storage').EndOfDayMap = {},
  blockedMap: import('./storage').TextMap = {},
  notesMap: import('./storage').TextMap = {}
): MissedDaySummary[] {
  const missedDays: MissedDaySummary[] = [];

  for (const day of plan) {
    if (day.date >= currentDate) continue;

    const missedTasks: MissedDayItem[] = [];
    const completedTasks: string[] = [];

    day.items.forEach((item, index) => {
      const key = `${day.date}:${index}`;
      const isDone = Boolean(states[key]);
      const override = taskOverrides[key];

      if (isDone || override?.action === 'unnecessary') {
        completedTasks.push(item);
      } else {
        const eodLog = endOfDayMap[day.date];
        const reason = eodLog?.taskReasons?.[key];
        missedTasks.push({
          index,
          item,
          itemKey: key,
          override,
          reason,
        });
      }
    });

    if (missedTasks.length > 0) {
      const detail = getTaskDetail(day, missedTasks[0]?.index);
      missedDays.push({
        date: day.date,
        day,
        missedTasks,
        completedTasks,
        blockedText: blockedMap[day.date],
        noteText: notesMap[day.date],
        whyItMatters: detail.why,
        dependencies: detail.dependencies,
        nextAction: `Complete ${missedTasks[0].item} before proceeding with ${currentDate} schedule.`,
      });
    }
  }

  return missedDays;
}

