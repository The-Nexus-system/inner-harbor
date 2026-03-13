-- Capacity/energy budget table for Feature Group O
CREATE TABLE public.capacity_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  budget_date date NOT NULL DEFAULT CURRENT_DATE,
  total_spoons smallint NOT NULL DEFAULT 12,
  entries jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, budget_date)
);

ALTER TABLE public.capacity_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own capacity budgets" ON public.capacity_budgets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own capacity budgets" ON public.capacity_budgets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own capacity budgets" ON public.capacity_budgets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own capacity budgets" ON public.capacity_budgets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_capacity_budgets_user_date ON public.capacity_budgets(user_id, budget_date);