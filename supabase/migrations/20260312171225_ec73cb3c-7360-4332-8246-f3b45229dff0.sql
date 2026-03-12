
CREATE TABLE public.quick_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.quick_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own quick notes" ON public.quick_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own quick notes" ON public.quick_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own quick notes" ON public.quick_notes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users update own quick notes" ON public.quick_notes FOR UPDATE USING (auth.uid() = user_id);
