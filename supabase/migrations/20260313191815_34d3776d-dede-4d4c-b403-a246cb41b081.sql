-- Create handoff_notes table
CREATE TABLE public.handoff_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  front_event_id uuid REFERENCES public.front_events(id) ON DELETE CASCADE,
  current_activity text,
  unfinished_tasks text,
  emotional_state text,
  important_reminders text,
  warnings text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create context_snapshots table
CREATE TABLE public.context_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  snapshot_time timestamptz NOT NULL DEFAULT now(),
  front_alter_ids text[] NOT NULL DEFAULT '{}',
  front_status text,
  active_tasks jsonb NOT NULL DEFAULT '[]',
  calendar_context jsonb NOT NULL DEFAULT '[]',
  mood smallint,
  stress smallint,
  energy smallint,
  notes text,
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for handoff_notes
ALTER TABLE public.handoff_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own handoff notes" ON public.handoff_notes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own handoff notes" ON public.handoff_notes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own handoff notes" ON public.handoff_notes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own handoff notes" ON public.handoff_notes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS for context_snapshots
ALTER TABLE public.context_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own context snapshots" ON public.context_snapshots
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own context snapshots" ON public.context_snapshots
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own context snapshots" ON public.context_snapshots
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own context snapshots" ON public.context_snapshots
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_handoff_notes_user_id ON public.handoff_notes(user_id);
CREATE INDEX idx_handoff_notes_front_event_id ON public.handoff_notes(front_event_id);
CREATE INDEX idx_context_snapshots_user_id ON public.context_snapshots(user_id);
CREATE INDEX idx_context_snapshots_time ON public.context_snapshots(snapshot_time DESC);