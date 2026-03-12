

## Feature Recommendations for Mosaic

After reviewing the full codebase, here is what's already built and what high-value features are missing for a DID/OSDD system management app.

### What exists today
- Alter profiles with detailed fields (triggers, grounding, access needs, visibility)
- Front tracking with quick-switch and history
- Journal entries (text, mood, flashback, seizure, victory types)
- Internal messaging between alters
- Task management with categories (medication, hygiene, meals, etc.)
- Daily check-in widget (mood, stress, pain, fatigue, dissociation)
- Safety plans (grounding, crisis, flashback, seizure, medical, hospital-card)
- Calendar events with preferred fronter and sensory prep
- Data export, accessibility settings, auth

### Proposed new features (6 additions)

**1. Grounding Toolbox page** — An interactive, immediate-access page with sensory grounding exercises (5-4-3-2-1 technique, breathing timer, cold water prompt, texture focus), personalized per alter based on their `groundingPreferences`. Accessible from the Safety card on Dashboard and a new sidebar entry. This is critical for dissociative crises where reading a static plan isn't enough.

**2. Safety Plan CRUD forms** — The Safety page currently only displays plans but has no way to create or edit them. Add a form for creating grounding/crisis/flashback/seizure/medical plans with step-by-step entry, trusted contact management, and plan type selection.

**3. Calendar Event CRUD forms** — The Calendar page only displays events. Add a form for creating/editing events with date picker, time, preferred fronter selector, sensory prep, support needed, and recovery time fields.

**4. Check-in history and trends chart** — The daily check-in currently shows only today. Add a trends view using recharts showing mood, stress, pain, fatigue, and dissociation over the past 7/14/30 days. Helps identify patterns (e.g., dissociation spikes on therapy days). Query `daily_check_ins` table with date range.

**5. Quick Notes / Sticky Board** — A lightweight, always-visible notes area on the Dashboard for leaving quick messages to the next fronter without the overhead of the full messaging system. Think "fridge notes" — e.g., "Meds taken at 2pm", "Therapy moved to Thursday", "Left food in microwave". Stored in a new `quick_notes` table with auto-expiry.

**6. Hospital / Emergency Card generator** — An exportable, printable card from the Safety page that shows: diagnosis, current medications, emergency contacts, communication preferences (e.g., "may become nonverbal"), seizure protocol, and allergies. The `hospital-card` safety plan type already exists but has no dedicated UI or print layout.

### Technical approach

- **Grounding Toolbox**: New page at `/grounding`, new sidebar entry. Pure frontend — breathing timer uses `setInterval` with animated SVG circle, 5-4-3-2-1 exercise is a stepped card UI. Pulls alter-specific grounding preferences from context.
- **Safety Plan & Calendar forms**: Follow existing form patterns (`AlterForm`, `TaskForm`). Add `createSafetyPlan` and `createCalendarEvent` mutations to SystemContext. Dynamic step list with add/remove buttons for safety plan steps.
- **Check-in trends**: Query last 30 days of `daily_check_ins` in SystemContext (new query). Render with recharts `LineChart` on Dashboard or a dedicated section. No new tables needed.
- **Quick Notes**: New migration for `quick_notes` table (`id, user_id, content, created_at, expires_at`) with RLS. Small widget on Dashboard with text input and dismissible cards.
- **Hospital Card**: New section on Safety page with print-optimized CSS (`@media print`). Renders from existing safety plan data + alter profiles. Export as PDF via `window.print()`.

### Implementation order
1. Safety Plan CRUD forms (unblocks the safety center)
2. Calendar Event CRUD forms (unblocks the calendar)
3. Check-in history trends chart
4. Grounding Toolbox page
5. Quick Notes sticky board (new table + migration)
6. Hospital Emergency Card generator

