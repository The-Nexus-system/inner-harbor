

# Plan: Pattern Insight Engine + Gentle Daily Summary & Timeline Stitching

This is a large feature set. Given the scope, I recommend implementing it in two phases across this session. All computation will happen client-side using existing data already loaded in `SystemContext`, with new database tables for persisting user preferences and saved insights.

---

## Database Changes (1 migration)

**New tables:**

1. **`insight_preferences`** — stores per-user settings for insights/summaries
   - `user_id` (uuid, PK, RLS), `insights_enabled` (bool, default true), `summaries_enabled` (bool, default true), `detail_mode` (text: 'brief'|'detailed', default 'brief'), `excluded_data_types` (text[], default '{}'), `include_location` (bool, default false), `low_stimulation` (bool, default false)

2. **`saved_insights`** — user-saved or dismissed insights
   - `id` (uuid), `user_id` (uuid, RLS), `insight_key` (text), `title` (text), `description` (text), `status` (text: 'saved'|'dismissed'|'useful'|'not_useful'|'uncertain'), `created_at`

3. **`daily_summaries`** — persisted daily summaries with user annotations
   - `id` (uuid), `user_id` (uuid, RLS), `summary_date` (date), `summary_data` (jsonb), `user_notes` (text), `created_at`

All tables get standard RLS: users CRUD own rows only.

---

## Feature 1: Pattern Insight Engine

### New files:
- **`src/lib/insights.ts`** — Pure functions that analyze arrays of front events, check-ins, journal entries, tasks, and calendar events to detect patterns. Returns typed `Insight[]` objects. All language uses gentle phrasing ("You may notice…", "There seems to be…"). Patterns detected:
  - Time-of-day switching clusters
  - Alter-context correlations
  - Fatigue/stress vs rapid switching
  - Seizure/PNES clustering around stress
  - Blurry/unknown front environmental patterns
  - Recovery time correlations
  - Grounding tool effectiveness

- **`src/hooks/useInsights.ts`** — Hook that calls insight functions with SystemContext data, manages saved/dismissed state via `saved_insights` table, and respects `insight_preferences`.

- **`src/components/InsightCard.tsx`** — Small dashboard card showing 1-2 top insights. Collapsible, hideable. Actions: dismiss, save, mark useful/not useful/uncertain.

- **`src/pages/InsightsPage.tsx`** — Full insights page with:
  - List of detected patterns with gentle language
  - Plain text summary section (first-class, not secondary)
  - Optional recharts visualizations with text alternatives
  - Saved insights section
  - Screen-reader optimized layout

### Dashboard integration:
- Add collapsible `InsightCard` to `Dashboard.tsx` grid

### Sidebar:
- Add "Insights" nav item with `Lightbulb` icon

---

## Feature 2: Gentle Daily Summary + Timeline Stitching

### New files:
- **`src/lib/timeline.ts`** — Pure functions to stitch a chronological timeline from front events, journal entries, messages, tasks, calendar events, and medical logs. Each event tagged as confirmed/uncertain/estimated. Handles gaps, overlaps, unknown fronts.

- **`src/lib/daily-summary.ts`** — Generates a daily summary object from timeline data. Uses gentle language ("Here is what we know about today", "Some parts are incomplete"). Includes weekly reflection generator.

- **`src/hooks/useDailySummary.ts`** — Hook combining timeline stitching + summary generation. Queries data for a given date, respects preferences, supports save/export.

- **`src/components/DailySummaryCard.tsx`** — Small dashboard card: "Today's summary" with collapsible preview. Links to full page.

- **`src/pages/TimelinePage.tsx`** — Full page with 5 view modes:
  1. Visual timeline (vertical, color-coded blocks)
  2. Text-first chronological list
  3. "What we know" reconstruction view
  4. Low-detail mode (minimal info for cognitive fatigue)
  5. Detailed mode (full review with all metadata)
  
  User interactions: confirm/mark uncertain, add notes, link memory gaps, save summary, export as text.

- **`src/components/WeeklyReflection.tsx`** — Optional weekly summary component showing common patterns, gaps, and what helped. Observational, not evaluative.

### Dashboard integration:
- Add collapsible `DailySummaryCard` to `Dashboard.tsx` grid

### Sidebar:
- Add "Timeline" nav item with `Clock` icon

---

## Settings Integration

Add new section to `SettingsPage.tsx` — "Insights & Summaries":
- Enable/disable pattern insights
- Enable/disable daily summaries
- Brief vs detailed mode
- Include/exclude data types (checkboxes)
- Include/exclude location
- Low-stimulation mode
- Persist to `insight_preferences` table

---

## Routing

Add to `App.tsx`:
- `/insights` → `InsightsPage`
- `/timeline` → `TimelinePage`

---

## Demo Data

Seed script additions (in migration or code):
- Sample front events with time patterns and a blurry/unknown period
- Check-ins showing fatigue-switching correlation
- A timeline gap (front event with no journal/task coverage)
- Sample saved insight marked "useful"
- A daily summary with confirmed + uncertain details

---

## Accessibility

All new components will maintain:
- Semantic HTML with proper headings hierarchy
- `aria-label` on interactive regions
- Keyboard-navigable timeline and insight actions
- Plain text summaries as first-class output
- Large tap targets, visible focus rings
- Reduced motion respected via existing CSS class
- Screen-reader friendly phrasing throughout

---

## Files to create (10):
1. `src/lib/insights.ts`
2. `src/lib/timeline.ts`
3. `src/lib/daily-summary.ts`
4. `src/hooks/useInsights.ts`
5. `src/hooks/useDailySummary.ts`
6. `src/components/InsightCard.tsx`
7. `src/components/DailySummaryCard.tsx`
8. `src/components/WeeklyReflection.tsx`
9. `src/pages/InsightsPage.tsx`
10. `src/pages/TimelinePage.tsx`

## Files to edit (5):
1. `src/pages/Dashboard.tsx` — add InsightCard + DailySummaryCard
2. `src/pages/SettingsPage.tsx` — add Insights & Summaries settings section
3. `src/components/AppSidebar.tsx` — add Insights + Timeline nav items
4. `src/App.tsx` — add routes
5. Migration SQL file — new tables + RLS + demo data

