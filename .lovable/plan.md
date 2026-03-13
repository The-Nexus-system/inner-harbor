

## Feature Group M (Handoff Notes) and N (Context Snapshots)

### What We're Building

**Handoff Notes** — A quick form alters fill out when leaving front, capturing current activity, unfinished tasks, emotional state, reminders, and warnings. Attached to `front_events` via `front_event_id`.

**Context Snapshots** — A "Snapshot Current Context" button that captures the moment: time, current front, active tasks, calendar context, mood/stress from latest check-in, and freeform notes. Standalone table, viewable later for reorientation.

### Database Changes (2 new tables)

**Table: `handoff_notes`**
- `id` uuid PK default gen_random_uuid()
- `user_id` uuid NOT NULL (RLS)
- `front_event_id` uuid references front_events(id) on delete cascade
- `current_activity` text
- `unfinished_tasks` text
- `emotional_state` text
- `important_reminders` text
- `warnings` text
- `created_at` timestamptz default now()

RLS: standard user_id = auth.uid() for all CRUD.

**Table: `context_snapshots`**
- `id` uuid PK default gen_random_uuid()
- `user_id` uuid NOT NULL (RLS)
- `snapshot_time` timestamptz default now()
- `front_alter_ids` text[] default '{}'
- `front_status` text
- `active_tasks` jsonb default '[]' (array of {id, title})
- `calendar_context` jsonb default '[]' (array of {id, title, time})
- `mood` smallint
- `stress` smallint
- `energy` smallint
- `notes` text
- `location` text
- `created_at` timestamptz default now()

RLS: standard user_id = auth.uid() for all CRUD.

### Code Changes

1. **New types** in `src/types/system.ts`: `HandoffNote` and `ContextSnapshot` interfaces.

2. **SystemContext extensions**: Add queries and mutations for both tables. Add `createHandoffNote`, `createContextSnapshot`, `handoffNotes`, `contextSnapshots` to context.

3. **New component: `src/components/HandoffNoteForm.tsx`**
   - Dialog/card form with fields: current activity, unfinished tasks, emotional state, reminders, warnings
   - Linked to current front event
   - Calm, supportive language ("Before you go, is there anything the next person should know?")
   - Accessible: semantic HTML, keyboard nav, screen reader labels

4. **New component: `src/components/ContextSnapshotButton.tsx`**
   - One-tap button that auto-captures current front, incomplete tasks, upcoming events, latest check-in mood/stress
   - Shows a brief confirmation with option to add notes
   - Calm feedback: "Snapshot saved. You can come back to this later."

5. **New page: `src/pages/SnapshotsPage.tsx`**
   - Lists context snapshots in reverse chronological order
   - Each snapshot rendered as a card showing front info, tasks, mood, notes
   - Text-first, accessible layout

6. **FrontPage integration**: Add a "Leave a handoff note" button near the Quick Switch card that opens the HandoffNoteForm dialog. Show recent handoff notes in a collapsible section below front history.

7. **Dashboard integration**: Add context snapshot button to the dashboard header area. Show latest handoff note if one exists for the current front event.

8. **QuickActionsPage**: Add "Take snapshot" and "Leave handoff note" as new quick actions.

9. **Sidebar & routing**: Add "Snapshots" nav item and `/snapshots` route in App.tsx.

### Implementation Order

1. Database migration (both tables)
2. Types + SystemContext extensions
3. HandoffNoteForm component
4. ContextSnapshotButton component
5. SnapshotsPage
6. Integration into FrontPage, Dashboard, QuickActions, Sidebar/routing

