
-- Create notification_subscriptions table
CREATE TABLE public.notification_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own subscriptions" ON public.notification_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subscriptions" ON public.notification_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own subscriptions" ON public.notification_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add reminder_minutes to calendar_events and tasks
ALTER TABLE public.calendar_events ADD COLUMN reminder_minutes INTEGER DEFAULT NULL;
ALTER TABLE public.tasks ADD COLUMN reminder_minutes INTEGER DEFAULT NULL;
