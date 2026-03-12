
-- insight_preferences: per-user settings for insight/summary features
CREATE TABLE public.insight_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insights_enabled boolean NOT NULL DEFAULT true,
  summaries_enabled boolean NOT NULL DEFAULT true,
  detail_mode text NOT NULL DEFAULT 'brief',
  excluded_data_types text[] NOT NULL DEFAULT '{}',
  include_location boolean NOT NULL DEFAULT false,
  low_stimulation boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.insight_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own insight prefs" ON public.insight_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own insight prefs" ON public.insight_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own insight prefs" ON public.insight_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_insight_preferences_updated_at BEFORE UPDATE ON public.insight_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- saved_insights: user-saved or dismissed pattern insights
CREATE TABLE public.saved_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_key text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'saved',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own saved insights" ON public.saved_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own saved insights" ON public.saved_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own saved insights" ON public.saved_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own saved insights" ON public.saved_insights FOR DELETE USING (auth.uid() = user_id);

-- daily_summaries: persisted daily summaries with user annotations
CREATE TABLE public.daily_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_date date NOT NULL,
  summary_data jsonb NOT NULL DEFAULT '{}',
  user_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, summary_date)
);

ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own daily summaries" ON public.daily_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own daily summaries" ON public.daily_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own daily summaries" ON public.daily_summaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own daily summaries" ON public.daily_summaries FOR DELETE USING (auth.uid() = user_id);
