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
    "dayOffset": 0,
    "week": 1,
    "phase": "Setup & Foundation",
    "dayInWeek": 1,
    "title": "Local PostgreSQL setup",
    "items": [
      "Install PostgreSQL on your laptop",
      "Create database bookingpartner_dev",
      "Create .env.local from the example",
      "Run Prisma migration",
      "Open pgAdmin and confirm your tables exist"
    ],
    "doneWhen": "Your local database opens and Prisma can connect without errors."
  },
  {
    "dayOffset": 1,
    "week": 1,
    "phase": "Setup & Foundation",
    "dayInWeek": 2,
    "title": "Prisma & login setup",
    "items": [
      "Create lib/prisma.ts singleton",
      "Create authentication configuration",
      "Create /api/auth/[...nextauth]/route.ts",
      "Create one test user",
      "Sign in and confirm the session is available"
    ],
    "doneWhen": "A test user can log in and a server route can read the session."
  },
  {
    "dayOffset": 2,
    "week": 1,
    "phase": "Setup & Foundation",
    "dayInWeek": 3,
    "title": "Route protection",
    "items": [
      "Create src/middleware.ts",
      "Block logged-out users from /owner",
      "Block customers from /admin",
      "Add role-based redirects",
      "Test each role in a private browser window"
    ],
    "doneWhen": "Wrong users receive 401/403 or a safe redirect."
  },
  {
    "dayOffset": 3,
    "week": 1,
    "phase": "Setup & Foundation",
    "dayInWeek": 4,
    "title": "Realtime setup",
    "items": [
      "Create a Pusher account",
      "Add server and browser keys",
      "Install pusher and pusher-js",
      "Create server/client helper files",
      "Open two seat-map tabs and test a live update"
    ],
    "doneWhen": "A change in one tab appears in the other without refresh."
  },
  {
    "dayOffset": 4,
    "week": 1,
    "phase": "Setup & Foundation",
    "dayInWeek": 5,
    "title": "Email setup",
    "items": [
      "Create a Resend account",
      "Add the API key to .env.local",
      "Create lib/email.ts",
      "Write sendBookingConfirmation()",
      "Send a test message to your own inbox"
    ],
    "doneWhen": "A test booking email arrives successfully."
  },
  {
    "dayOffset": 5,
    "week": 1,
    "phase": "Setup & Foundation",
    "dayInWeek": 6,
    "title": "PayHere sandbox setup",
    "items": [
      "Create or open a PayHere sandbox merchant account",
      "Add merchant ID and sandbox secret",
      "Create lib/payhere.ts",
      "Write generatePayHereData()",
      "Log generated form data for one fake booking"
    ],
    "doneWhen": "The backend creates valid-looking sandbox payment data."
  },
  {
    "dayOffset": 6,
    "week": 1,
    "phase": "Setup & Foundation",
    "dayInWeek": 7,
    "title": "PayHere verification",
    "items": [
      "Write verifyPayHereWebhook()",
      "Reject a deliberately wrong signature",
      "Accept a valid test signature",
      "Log failed verification attempts",
      "Document the fields you trust only after verification"
    ],
    "doneWhen": "Invalid payment callbacks are rejected before any booking changes."
  },
  {
    "dayOffset": 7,
    "week": 2,
    "phase": "Authentication & Users",
    "dayInWeek": 1,
    "title": "Customer registration",
    "items": [
      "Create POST /api/v1/auth/register",
      "Validate name, email and password",
      "Hash the password",
      "Create the user record",
      "Return safe errors without exposing secrets"
    ],
    "doneWhen": "A valid customer is created and invalid input is rejected."
  },
  {
    "dayOffset": 8,
    "week": 2,
    "phase": "Authentication & Users",
    "dayInWeek": 2,
    "title": "Verification email",
    "items": [
      "Create a verification token",
      "Store token expiry",
      "Send verification email",
      "Add a simple verification link",
      "Test an expired token case"
    ],
    "doneWhen": "A new account receives a working verification link."
  },
  {
    "dayOffset": 9,
    "week": 2,
    "phase": "Authentication & Users",
    "dayInWeek": 3,
    "title": "Verify email endpoint",
    "items": [
      "Create GET /api/v1/auth/verify-email",
      "Find the token",
      "Check expiry",
      "Mark the user verified",
      "Redirect to login with a clear result"
    ],
    "doneWhen": "Opening a valid link marks the correct user as verified."
  },
  {
    "dayOffset": 10,
    "week": 2,
    "phase": "Authentication & Users",
    "dayInWeek": 4,
    "title": "Owner OTP - send",
    "items": [
      "Create POST /api/v1/owner-auth/send-otp",
      "Validate phone/email target",
      "Generate short-lived OTP",
      "Store only what you need",
      "Add resend/rate-limit rules"
    ],
    "doneWhen": "A valid owner can request an OTP without unlimited spam."
  },
  {
    "dayOffset": 11,
    "week": 2,
    "phase": "Authentication & Users",
    "dayInWeek": 5,
    "title": "Owner OTP - verify & register",
    "items": [
      "Create verify-otp endpoint",
      "Reject wrong or expired OTP",
      "Create owner registration endpoint",
      "Link owner profile to user",
      "Test the complete owner signup flow"
    ],
    "doneWhen": "A new owner can complete OTP registration end to end."
  },
  {
    "dayOffset": 12,
    "week": 2,
    "phase": "Authentication & Users",
    "dayInWeek": 6,
    "title": "Password recovery",
    "items": [
      "Create forgot-password endpoint",
      "Create reset token with expiry",
      "Send reset email",
      "Create reset-password endpoint",
      "Invalidate the token after use"
    ],
    "doneWhen": "A customer can reset a forgotten password once per token."
  },
  {
    "dayOffset": 13,
    "week": 2,
    "phase": "Authentication & Users",
    "dayInWeek": 7,
    "title": "Auth test day",
    "items": [
      "Test customer registration",
      "Test owner registration",
      "Test login/logout",
      "Test email verification and password reset",
      "Standardize error responses for every auth route"
    ],
    "doneWhen": "All auth journeys work without manual database edits."
  },
  {
    "dayOffset": 14,
    "week": 3,
    "phase": "Cities, Routes & Buses",
    "dayInWeek": 1,
    "title": "Cities API",
    "items": [
      "Create GET /api/v1/cities",
      "Return active cities only",
      "Sort names for dropdowns",
      "Add basic caching if useful",
      "Connect one frontend city dropdown"
    ],
    "doneWhen": "The frontend can load active cities from the real API."
  },
  {
    "dayOffset": 15,
    "week": 3,
    "phase": "Cities, Routes & Buses",
    "dayInWeek": 2,
    "title": "Routes & search",
    "items": [
      "Create GET /api/v1/routes",
      "Include from/to city data",
      "Create GET /api/v1/search",
      "Filter by from, to and date",
      "Return seat count and price for each schedule"
    ],
    "doneWhen": "Searching a real route returns matching schedules."
  },
  {
    "dayOffset": 16,
    "week": 3,
    "phase": "Cities, Routes & Buses",
    "dayInWeek": 3,
    "title": "Owner bus list & create",
    "items": [
      "Create GET /api/v1/owner/buses",
      "Scope buses to the logged-in owner",
      "Create POST /api/v1/owner/buses",
      "Validate bus fields",
      "Test creating two sample buses"
    ],
    "doneWhen": "An owner sees only their buses and can add one."
  },
  {
    "dayOffset": 17,
    "week": 3,
    "phase": "Cities, Routes & Buses",
    "dayInWeek": 4,
    "title": "Bus detail & edit",
    "items": [
      "Create GET /api/v1/owner/buses/[id]",
      "Check ownership before returning data",
      "Create PATCH endpoint",
      "Validate editable fields",
      "Test another owner cannot edit the bus"
    ],
    "doneWhen": "Bus detail/edit is owner-scoped and secure."
  },
  {
    "dayOffset": 18,
    "week": 3,
    "phase": "Cities, Routes & Buses",
    "dayInWeek": 5,
    "title": "Seat layout API",
    "items": [
      "Create GET /api/v1/buses/[id]/seats",
      "Create POST save-seat-layout endpoint",
      "Store seat type and position",
      "Reject duplicate seat numbers",
      "Load the saved layout in the frontend"
    ],
    "doneWhen": "A saved seat layout returns exactly the same shape."
  },
  {
    "dayOffset": 19,
    "week": 3,
    "phase": "Cities, Routes & Buses",
    "dayInWeek": 6,
    "title": "Automatic seat numbers",
    "items": [
      "Write automatic seat-number generation",
      "Test common 2+2 layout",
      "Test 2+1 layout",
      "Test missing/blocked positions",
      "Make numbering deterministic"
    ],
    "doneWhen": "All supported layouts generate stable unique seat numbers."
  },
  {
    "dayOffset": 20,
    "week": 3,
    "phase": "Cities, Routes & Buses",
    "dayInWeek": 7,
    "title": "Bus API test day",
    "items": [
      "Test city endpoints",
      "Test route/search endpoints",
      "Test bus CRUD",
      "Test every seat layout type",
      "Fix validation and data-shape bugs"
    ],
    "doneWhen": "The buses/routes area can run without mock data."
  },
  {
    "dayOffset": 21,
    "week": 4,
    "phase": "Schedules",
    "dayInWeek": 1,
    "title": "Create schedule",
    "items": [
      "Create POST /api/v1/owner/schedules",
      "Validate route, bus, date and time",
      "Save the schedule",
      "Generate schedule-seat rows",
      "Return the new schedule ID"
    ],
    "doneWhen": "Creating one schedule also creates its seat inventory."
  },
  {
    "dayOffset": 22,
    "week": 4,
    "phase": "Schedules",
    "dayInWeek": 2,
    "title": "Schedule list",
    "items": [
      "Create GET /api/v1/owner/schedules",
      "Scope to owner",
      "Filter by bus",
      "Filter by date and status",
      "Connect the owner schedule list UI"
    ],
    "doneWhen": "Owner schedule filtering works with real data."
  },
  {
    "dayOffset": 23,
    "week": 4,
    "phase": "Schedules",
    "dayInWeek": 3,
    "title": "Schedule detail",
    "items": [
      "Create GET /api/v1/owner/schedules/[id]",
      "Return route and bus details",
      "Return live seat counts",
      "Check owner scope",
      "Handle missing schedules cleanly"
    ],
    "doneWhen": "The detail screen gets all required data in one response."
  },
  {
    "dayOffset": 24,
    "week": 4,
    "phase": "Schedules",
    "dayInWeek": 4,
    "title": "Repeat schedules",
    "items": [
      "Support daily repeats",
      "Support weekly repeats",
      "Create separate schedule rows",
      "Link them with repeat_group_id",
      "Generate seats for every repeated schedule"
    ],
    "doneWhen": "A repeat request creates the expected future schedules and seats."
  },
  {
    "dayOffset": 25,
    "week": 4,
    "phase": "Schedules",
    "dayInWeek": 5,
    "title": "Conflict detection",
    "items": [
      "Check the same bus on the same date",
      "Compare schedule times",
      "Return a warning instead of a hard error",
      "Show warning in the UI",
      "Test overlapping and non-overlapping cases"
    ],
    "doneWhen": "Owners see a clear conflict warning before saving risky times."
  },
  {
    "dayOffset": 26,
    "week": 4,
    "phase": "Schedules",
    "dayInWeek": 6,
    "title": "Change departure time",
    "items": [
      "Create update-time endpoint",
      "Allow later time changes",
      "Block disallowed earlier moves",
      "Find confirmed passengers",
      "Send a schedule-change notification"
    ],
    "doneWhen": "A valid time change updates data and notifies affected passengers."
  },
  {
    "dayOffset": 27,
    "week": 4,
    "phase": "Schedules",
    "dayInWeek": 7,
    "title": "Cancel & manifest",
    "items": [
      "Create schedule cancel endpoint",
      "Handle zero-booking cancellation",
      "Block cancellation inside your cutoff",
      "Refund eligible bookings to wallet",
      "Create passenger manifest endpoint/PDF data"
    ],
    "doneWhen": "Cancellation rules and passenger manifest both work on test schedules."
  },
  {
    "dayOffset": 28,
    "week": 5,
    "phase": "Seat Locking & Realtime",
    "dayInWeek": 1,
    "title": "Atomic seat lock",
    "items": [
      "Create POST /api/v1/seats/lock",
      "Update only when seat is available",
      "Store locked_by",
      "Store locked_until for 10 minutes",
      "Return 409 when another user already owns it"
    ],
    "doneWhen": "Two users cannot successfully lock the same seat."
  },
  {
    "dayOffset": 29,
    "week": 5,
    "phase": "Seat Locking & Realtime",
    "dayInWeek": 2,
    "title": "Seat release",
    "items": [
      "Create POST /api/v1/seats/release",
      "Check current user owns the lock",
      "Set seat back to available",
      "Clear lock fields",
      "Broadcast release event"
    ],
    "doneWhen": "Only the lock owner can manually release that seat."
  },
  {
    "dayOffset": 30,
    "week": 5,
    "phase": "Seat Locking & Realtime",
    "dayInWeek": 3,
    "title": "Expired-lock cron",
    "items": [
      "Create POST /api/cron/release-locks",
      "Find expired locks",
      "Release them safely",
      "Return count released",
      "Test by creating an already-expired lock"
    ],
    "doneWhen": "Expired seats return to available automatically when cron runs."
  },
  {
    "dayOffset": 31,
    "week": 5,
    "phase": "Seat Locking & Realtime",
    "dayInWeek": 4,
    "title": "Protect cron & broadcast",
    "items": [
      "Verify CRON_SECRET",
      "Reject missing/wrong secret",
      "Broadcast each released seat",
      "Avoid exposing secret in client code",
      "Add simple cron logging"
    ],
    "doneWhen": "Only an authorized cron request can release expired locks."
  },
  {
    "dayOffset": 32,
    "week": 5,
    "phase": "Seat Locking & Realtime",
    "dayInWeek": 5,
    "title": "Seat-view API",
    "items": [
      "Create GET /api/v1/seats/[scheduleId]",
      "Return current seat status",
      "Include remaining lock time where safe",
      "Sort seats for the map",
      "Connect initial seat-map load"
    ],
    "doneWhen": "Opening a schedule immediately shows its current seat state."
  },
  {
    "dayOffset": 33,
    "week": 5,
    "phase": "Seat Locking & Realtime",
    "dayInWeek": 6,
    "title": "Two-browser realtime test",
    "items": [
      "Open two separate browser sessions",
      "Lock a seat in browser A",
      "Confirm browser B updates",
      "Release/expire the lock",
      "Confirm both screens become available again"
    ],
    "doneWhen": "Realtime changes appear without refresh in both sessions."
  },
  {
    "dayOffset": 34,
    "week": 5,
    "phase": "Seat Locking & Realtime",
    "dayInWeek": 7,
    "title": "Concurrency edge cases",
    "items": [
      "Simulate simultaneous lock requests",
      "Confirm only one succeeds",
      "Verify unique/database constraints",
      "Test stale UI clicks",
      "Record and fix any race-condition bug"
    ],
    "doneWhen": "Database rules remain correct even under simultaneous clicks."
  },
  {
    "dayOffset": 35,
    "week": 6,
    "phase": "Payments & Bookings",
    "dayInWeek": 1,
    "title": "Create pending booking",
    "items": [
      "Create POST /api/v1/bookings",
      "Verify user owns the seat lock",
      "Create booking with pending status",
      "Generate PayHere form data",
      "Return only browser-safe payment fields"
    ],
    "doneWhen": "A locked seat can create exactly one pending booking."
  },
  {
    "dayOffset": 36,
    "week": 6,
    "phase": "Payments & Bookings",
    "dayInWeek": 2,
    "title": "Payment webhook verification",
    "items": [
      "Create POST /api/v1/payments/webhook",
      "Verify signature before changes",
      "Reject bad signatures with 400",
      "Make webhook safe to receive twice",
      "Log payment reference and result"
    ],
    "doneWhen": "Fake callbacks cannot confirm a booking and duplicates are harmless."
  },
  {
    "dayOffset": 37,
    "week": 6,
    "phase": "Payments & Bookings",
    "dayInWeek": 3,
    "title": "Confirm booking transaction",
    "items": [
      "Mark payment successful",
      "Mark booking confirmed",
      "Mark seat booked",
      "Create payout record",
      "Keep related changes in one database transaction where possible"
    ],
    "doneWhen": "A valid payment leaves booking, seat and payout records consistent."
  },
  {
    "dayOffset": 38,
    "week": 6,
    "phase": "Payments & Bookings",
    "dayInWeek": 4,
    "title": "Confirmation messages",
    "items": [
      "Send confirmation email",
      "Send confirmation SMS",
      "Broadcast booked seat",
      "Create in-app notification",
      "Handle email/SMS failure without undoing payment"
    ],
    "doneWhen": "Payment confirmation succeeds even if a message provider is temporarily down."
  },
  {
    "dayOffset": 39,
    "week": 6,
    "phase": "Payments & Bookings",
    "dayInWeek": 5,
    "title": "Wallet",
    "items": [
      "Apply wallet credit before PayHere amount",
      "Store wallet transaction",
      "Update wallet balance safely",
      "Prevent negative wallet balance",
      "Test full-wallet and partial-wallet payments"
    ],
    "doneWhen": "Wallet totals remain correct for both full and partial use."
  },
  {
    "dayOffset": 40,
    "week": 6,
    "phase": "Payments & Bookings",
    "dayInWeek": 6,
    "title": "Booking list & detail",
    "items": [
      "Create GET /api/v1/bookings",
      "Filter by current customer",
      "Create GET /api/v1/bookings/[id]",
      "Filter by booking ID plus customer ID",
      "Test guessed booking IDs"
    ],
    "doneWhen": "Customer A cannot read Customer B's booking."
  },
  {
    "dayOffset": 41,
    "week": 6,
    "phase": "Payments & Bookings",
    "dayInWeek": 7,
    "title": "Cancellation & ticket",
    "items": [
      "Create booking cancel endpoint",
      "Use policy snapshot to calculate refund",
      "Credit wallet and release seat",
      "Send cancellation messages",
      "Create ticket PDF endpoint with QR data"
    ],
    "doneWhen": "Cancellation, refund, seat release and ticket access all follow ownership rules."
  },
  {
    "dayOffset": 42,
    "week": 7,
    "phase": "Owner Operations",
    "dayInWeek": 1,
    "title": "Owner earnings",
    "items": [
      "Create GET /api/v1/owner/earnings",
      "Calculate pending payouts",
      "Calculate sent payouts",
      "Calculate totals",
      "Group earnings by trip"
    ],
    "doneWhen": "Dashboard totals match test payout rows."
  },
  {
    "dayOffset": 43,
    "week": 7,
    "phase": "Owner Operations",
    "dayInWeek": 2,
    "title": "Owner payouts",
    "items": [
      "Create GET /api/v1/owner/payouts",
      "Return per-trip breakdown",
      "Include payout status",
      "Add pagination",
      "Connect payout cards"
    ],
    "doneWhen": "Owner sees only their own payout history."
  },
  {
    "dayOffset": 44,
    "week": 7,
    "phase": "Owner Operations",
    "dayInWeek": 3,
    "title": "Employees - invite/list",
    "items": [
      "Create employee invite endpoint",
      "Send invitation email",
      "Create employee list endpoint",
      "Show active/invited state",
      "Prevent duplicate invitations"
    ],
    "doneWhen": "An owner can invite and see a new employee."
  },
  {
    "dayOffset": 45,
    "week": 7,
    "phase": "Owner Operations",
    "dayInWeek": 4,
    "title": "Employees - permissions",
    "items": [
      "Create assign endpoint",
      "Link employee to buses",
      "Create permission update endpoint",
      "Create deactivate endpoint",
      "Test employee cannot access unassigned bus"
    ],
    "doneWhen": "Employee access follows assigned buses and permissions."
  },
  {
    "dayOffset": 46,
    "week": 7,
    "phase": "Owner Operations",
    "dayInWeek": 5,
    "title": "Owner settings - company/bank",
    "items": [
      "Create company settings endpoint",
      "Create bank-change request endpoint",
      "Validate required business details",
      "Do not expose sensitive bank data unnecessarily",
      "Connect settings form"
    ],
    "doneWhen": "Owner can save company data and submit a bank-change request."
  },
  {
    "dayOffset": 47,
    "week": 7,
    "phase": "Owner Operations",
    "dayInWeek": 6,
    "title": "Owner settings - policy/security",
    "items": [
      "Create refund-policy endpoint",
      "Create notification settings endpoint",
      "Create password-change endpoint",
      "Require current password for sensitive change",
      "Test invalid password case"
    ],
    "doneWhen": "Sensitive settings changes require proper authentication."
  },
  {
    "dayOffset": 48,
    "week": 7,
    "phase": "Owner Operations",
    "dayInWeek": 7,
    "title": "Manual booking",
    "items": [
      "Create POST /api/v1/owner/bookings",
      "Mark is_manual = true",
      "Do not create online payment",
      "Do not charge commission if that is your rule",
      "Reserve the selected seat safely"
    ],
    "doneWhen": "Owner walk-in booking appears correctly without online payment."
  },
  {
    "dayOffset": 49,
    "week": 8,
    "phase": "Admin APIs",
    "dayInWeek": 1,
    "title": "Admin owner list",
    "items": [
      "Create GET /api/v1/admin/owners",
      "Require admin role",
      "Paginate results",
      "Add useful filters",
      "Return safe owner summary fields"
    ],
    "doneWhen": "Admin can browse owners without leaking unrelated secrets."
  },
  {
    "dayOffset": 50,
    "week": 8,
    "phase": "Admin APIs",
    "dayInWeek": 2,
    "title": "Owner moderation & audit",
    "items": [
      "Create approve/reject/suspend endpoint",
      "Validate allowed state changes",
      "Write every action to audit_logs",
      "Store acting admin ID",
      "Test non-admin receives 403"
    ],
    "doneWhen": "Every moderation action has an audit trail."
  },
  {
    "dayOffset": 51,
    "week": 8,
    "phase": "Admin APIs",
    "dayInWeek": 3,
    "title": "Bus verification",
    "items": [
      "Create GET /api/v1/admin/buses",
      "Filter pending buses",
      "Create approve/reject action",
      "Store review notes",
      "Notify owner after decision"
    ],
    "doneWhen": "Pending bus verification can be completed by admins only."
  },
  {
    "dayOffset": 52,
    "week": 8,
    "phase": "Admin APIs",
    "dayInWeek": 4,
    "title": "Admin payouts - list/bulk",
    "items": [
      "Create GET /api/v1/admin/payouts",
      "Add status filters",
      "Create release-all action",
      "Skip ineligible payouts",
      "Return released/skipped counts"
    ],
    "doneWhen": "Bulk payout release only changes eligible records."
  },
  {
    "dayOffset": 53,
    "week": 8,
    "phase": "Admin APIs",
    "dayInWeek": 5,
    "title": "Admin payout action",
    "items": [
      "Create payout release action",
      "Create withhold action",
      "Require reason for withhold",
      "Write audit log",
      "Notify affected owner"
    ],
    "doneWhen": "Single payout decisions are traceable and reversible by policy."
  },
  {
    "dayOffset": 54,
    "week": 8,
    "phase": "Admin APIs",
    "dayInWeek": 6,
    "title": "Reports centre",
    "items": [
      "Create GET /api/v1/admin/reports",
      "Create reply endpoint",
      "Create status endpoint",
      "Store admin responder",
      "Test report lifecycle"
    ],
    "doneWhen": "Admin can read, reply to and close a report."
  },
  {
    "dayOffset": 55,
    "week": 8,
    "phase": "Admin APIs",
    "dayInWeek": 7,
    "title": "Admin analytics",
    "items": [
      "Create GET /api/v1/admin/analytics",
      "Bookings per day",
      "Revenue breakdown",
      "Top routes",
      "Use indexed/date-bounded queries"
    ],
    "doneWhen": "Admin analytics returns correct totals on seeded test data."
  },
  {
    "dayOffset": 56,
    "week": 9,
    "phase": "Management, Transfers & Reviews",
    "dayInWeek": 1,
    "title": "Management schedules",
    "items": [
      "Create management schedule list",
      "Create management schedule creation",
      "Require management role",
      "Scope to creator's owner",
      "Test cross-owner request"
    ],
    "doneWhen": "Management can work only inside the correct owner's data."
  },
  {
    "dayOffset": 57,
    "week": 9,
    "phase": "Management, Transfers & Reviews",
    "dayInWeek": 2,
    "title": "Management bookings",
    "items": [
      "Create management booking list",
      "Create walk-in booking",
      "Reuse seat-lock safety",
      "Mark booking source",
      "Test access scope"
    ],
    "doneWhen": "Management walk-ins cannot touch another owner's inventory."
  },
  {
    "dayOffset": 58,
    "week": 9,
    "phase": "Management, Transfers & Reviews",
    "dayInWeek": 3,
    "title": "Management buses",
    "items": [
      "Create management bus endpoint",
      "Return assigned buses only",
      "Apply employee permissions",
      "Hide owner-only financial fields",
      "Test suspended user"
    ],
    "doneWhen": "Management sees only the buses and fields they are allowed to use."
  },
  {
    "dayOffset": 59,
    "week": 9,
    "phase": "Management, Transfers & Reviews",
    "dayInWeek": 4,
    "title": "Transfers - request/preview",
    "items": [
      "Create transfer request endpoint",
      "Generate short-lived transfer code",
      "Create preview endpoint",
      "Hide unnecessary personal data",
      "Set two-hour expiry"
    ],
    "doneWhen": "A valid code can safely preview the intended transfer."
  },
  {
    "dayOffset": 60,
    "week": 9,
    "phase": "Management, Transfers & Reviews",
    "dayInWeek": 5,
    "title": "Transfers - accept/decline",
    "items": [
      "Create accept endpoint",
      "Create decline endpoint",
      "Ensure only intended recipient accepts",
      "Change booking ownership safely",
      "Invalidate code after final action"
    ],
    "doneWhen": "A transfer code can be completed only once by the correct user."
  },
  {
    "dayOffset": 61,
    "week": 9,
    "phase": "Management, Transfers & Reviews",
    "dayInWeek": 6,
    "title": "Transfer expiry & reviews",
    "items": [
      "Create cron to expire old transfers",
      "Create review POST endpoint",
      "Allow reviews only after travel date",
      "Create bus review list",
      "Calculate average rating"
    ],
    "doneWhen": "Expired transfers close automatically and only travelled users can review."
  },
  {
    "dayOffset": 62,
    "week": 9,
    "phase": "Management, Transfers & Reviews",
    "dayInWeek": 7,
    "title": "Notifications",
    "items": [
      "Create GET /api/v1/notifications",
      "Create mark-read endpoint",
      "Verify earlier flows create notifications",
      "Add unread count",
      "Test booking, cancellation and schedule-change notifications"
    ],
    "doneWhen": "Important user actions produce visible, readable notifications."
  },
  {
    "dayOffset": 63,
    "week": 10,
    "phase": "Security, Testing & Integration",
    "dayInWeek": 1,
    "title": "API inventory test",
    "items": [
      "Make a list of every endpoint",
      "Test happy path for each",
      "Test validation errors",
      "Test missing resources",
      "Record remaining bugs"
    ],
    "doneWhen": "Every endpoint has at least one passing success and failure test."
  },
  {
    "dayOffset": 64,
    "week": 10,
    "phase": "Security, Testing & Integration",
    "dayInWeek": 2,
    "title": "IDOR security test",
    "items": [
      "Create two customer accounts",
      "Try Customer A's IDs as Customer B",
      "Test booking detail",
      "Test ticket download",
      "Test cancellations and transfers"
    ],
    "doneWhen": "Guessing another customer's ID never exposes or changes their data."
  },
  {
    "dayOffset": 65,
    "week": 10,
    "phase": "Security, Testing & Integration",
    "dayInWeek": 3,
    "title": "Role security test",
    "items": [
      "Test customer against owner routes",
      "Test management against earnings",
      "Test owner against admin",
      "Test logged-out requests",
      "Fix every unexpected 200 response"
    ],
    "doneWhen": "Every protected route returns the correct 401/403 result."
  },
  {
    "dayOffset": 66,
    "week": 10,
    "phase": "Security, Testing & Integration",
    "dayInWeek": 4,
    "title": "PayHere sandbox E2E",
    "items": [
      "Run successful sandbox payment",
      "Run failed payment",
      "Run cancelled payment",
      "Replay the webhook",
      "Check database consistency after each"
    ],
    "doneWhen": "Payment status always matches booking and seat status."
  },
  {
    "dayOffset": 67,
    "week": 10,
    "phase": "Security, Testing & Integration",
    "dayInWeek": 5,
    "title": "Concurrency & cron test",
    "items": [
      "Run simultaneous seat-lock requests",
      "Run lock-release cron",
      "Run transfer-expiry cron",
      "Test retries",
      "Review logs for duplicate side effects"
    ],
    "doneWhen": "Concurrent/repeated jobs do not create duplicate business actions."
  },
  {
    "dayOffset": 68,
    "week": 10,
    "phase": "Security, Testing & Integration",
    "dayInWeek": 6,
    "title": "Connect frontend",
    "items": [
      "Replace remaining mock data",
      "Connect search",
      "Connect owner/admin pages",
      "Fix API response shape mismatches",
      "Add user-friendly loading/error states"
    ],
    "doneWhen": "Core screens use real APIs instead of hard-coded demo data."
  },
  {
    "dayOffset": 69,
    "week": 10,
    "phase": "Security, Testing & Integration",
    "dayInWeek": 7,
    "title": "Customer E2E",
    "items": [
      "Register",
      "Search",
      "Select and lock seat",
      "Pay in sandbox",
      "Confirm email/SMS and dashboard booking"
    ],
    "doneWhen": "The complete customer journey works without manual intervention."
  },
  {
    "dayOffset": 70,
    "week": 11,
    "phase": "Production Preparation",
    "dayInWeek": 1,
    "title": "Vercel setup",
    "items": [
      "Push clean code to GitHub",
      "Create Vercel project",
      "Connect production branch",
      "Check build command",
      "Deploy a first production preview"
    ],
    "doneWhen": "The app builds successfully on Vercel."
  },
  {
    "dayOffset": 71,
    "week": 11,
    "phase": "Production Preparation",
    "dayInWeek": 2,
    "title": "Production PostgreSQL",
    "items": [
      "Create Railway PostgreSQL",
      "Copy production connection string securely",
      "Set connection pooling if needed",
      "Restrict who can see credentials",
      "Test connection from a safe environment"
    ],
    "doneWhen": "Production app can connect to the production database."
  },
  {
    "dayOffset": 72,
    "week": 11,
    "phase": "Production Preparation",
    "dayInWeek": 3,
    "title": "Deploy migrations",
    "items": [
      "Review pending migrations",
      "Back up before changing existing data",
      "Run prisma migrate deploy",
      "Run prisma generate in build",
      "Verify expected production tables"
    ],
    "doneWhen": "Production schema matches the application schema."
  },
  {
    "dayOffset": 73,
    "week": 11,
    "phase": "Production Preparation",
    "dayInWeek": 4,
    "title": "Production environment variables",
    "items": [
      "Set auth secrets",
      "Set database URL",
      "Set Pusher keys",
      "Set PayHere/Resend/SMS keys",
      "Set CRON_SECRET and public app URL"
    ],
    "doneWhen": "Production has all required variables and no secret is exposed client-side."
  },
  {
    "dayOffset": 74,
    "week": 11,
    "phase": "Production Preparation",
    "dayInWeek": 5,
    "title": "Production smoke test",
    "items": [
      "Open public homepage",
      "Log in with test account",
      "Run search",
      "Open owner dashboard",
      "Check database and realtime connectivity"
    ],
    "doneWhen": "Main screens work on the production URL."
  },
  {
    "dayOffset": 75,
    "week": 11,
    "phase": "Production Preparation",
    "dayInWeek": 6,
    "title": "Logs & failure handling",
    "items": [
      "Check Vercel logs",
      "Check database logs/metrics",
      "Add useful server error logging",
      "Confirm provider failures are visible",
      "Remove noisy secret-bearing logs"
    ],
    "doneWhen": "You can diagnose failures without leaking sensitive values."
  },
  {
    "dayOffset": 76,
    "week": 11,
    "phase": "Production Preparation",
    "dayInWeek": 7,
    "title": "Production security pass",
    "items": [
      "Review RLS/role checks",
      "Review webhook signature verification",
      "Review cron secret",
      "Review environment exposure",
      "Review rate limits on sensitive actions"
    ],
    "doneWhen": "No known high-risk security issue remains before onboarding an operator."
  },
  {
    "dayOffset": 77,
    "week": 12,
    "phase": "Pilot & Soft Launch",
    "dayInWeek": 1,
    "title": "Onboard first operator",
    "items": [
      "Create the operator account",
      "Enter company details",
      "Add first bus",
      "Configure seat layout",
      "Confirm owner can log in"
    ],
    "doneWhen": "The first real operator can access a correctly configured account."
  },
  {
    "dayOffset": 78,
    "week": 12,
    "phase": "Pilot & Soft Launch",
    "dayInWeek": 2,
    "title": "Configure routes",
    "items": [
      "Add operator routes",
      "Add prices",
      "Add departure points",
      "Create first schedules",
      "Double-check dates and times"
    ],
    "doneWhen": "The operator's real services appear in search as intended."
  },
  {
    "dayOffset": 79,
    "week": 12,
    "phase": "Pilot & Soft Launch",
    "dayInWeek": 3,
    "title": "Pilot seat-map test",
    "items": [
      "Open real schedule",
      "Check every seat label",
      "Lock/release from two devices",
      "Check owner view",
      "Fix layout mistakes before taking money"
    ],
    "doneWhen": "Live seat state is correct on customer and owner screens."
  },
  {
    "dayOffset": 80,
    "week": 12,
    "phase": "Pilot & Soft Launch",
    "dayInWeek": 4,
    "title": "Real-money controlled test",
    "items": [
      "Use a small controlled booking",
      "Verify PayHere payment result",
      "Verify booking confirmation",
      "Verify payout record",
      "Keep proof/reference for reconciliation"
    ],
    "doneWhen": "One controlled live payment reconciles correctly end to end."
  },
  {
    "dayOffset": 81,
    "week": 12,
    "phase": "Pilot & Soft Launch",
    "dayInWeek": 5,
    "title": "Messages & cancellation test",
    "items": [
      "Verify real confirmation email",
      "Verify real SMS",
      "Test ticket access",
      "Test allowed cancellation/refund path",
      "Check wallet result"
    ],
    "doneWhen": "The real customer communication and refund path behave correctly."
  },
  {
    "dayOffset": 82,
    "week": 12,
    "phase": "Pilot & Soft Launch",
    "dayInWeek": 6,
    "title": "Fix & second operator",
    "items": [
      "Fix pilot bugs",
      "Repeat critical tests",
      "Onboard a second operator",
      "Compare configuration differences",
      "Freeze risky new features for launch"
    ],
    "doneWhen": "Two operators can use the same production system reliably."
  },
  {
    "dayOffset": 83,
    "week": 12,
    "phase": "Pilot & Soft Launch",
    "dayInWeek": 7,
    "title": "Soft launch",
    "items": [
      "Take a fresh database backup",
      "Confirm monitoring/log access",
      "Confirm support contact process",
      "Open service to the pilot audience",
      "Review the first bookings carefully"
    ],
    "doneWhen": "BookingPartner is live for a controlled audience with support and rollback options ready."
  }
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
