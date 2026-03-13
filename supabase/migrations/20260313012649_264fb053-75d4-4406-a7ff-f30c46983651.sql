
-- Calendar accounts: stores OAuth/provider connections
CREATE TABLE public.calendar_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('google', 'ics', 'caldav', 'apple_native')),
  access_token text,
  refresh_token text,
  expires_at timestamp with time zone,
  account_email text,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'expired', 'error')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own calendar accounts" ON public.calendar_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own calendar accounts" ON public.calendar_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own calendar accounts" ON public.calendar_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own calendar accounts" ON public.calendar_accounts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_calendar_accounts_updated_at BEFORE UPDATE ON public.calendar_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- External calendars: individual calendars within an account
CREATE TABLE public.external_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_account_id uuid NOT NULL REFERENCES public.calendar_accounts(id) ON DELETE CASCADE,
  provider_calendar_id text NOT NULL,
  name text NOT NULL,
  color text,
  read_only boolean NOT NULL DEFAULT false,
  is_selected boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.external_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own external calendars" ON public.external_calendars FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.calendar_accounts ca WHERE ca.id = calendar_account_id AND ca.user_id = auth.uid())
);
CREATE POLICY "Users insert own external calendars" ON public.external_calendars FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.calendar_accounts ca WHERE ca.id = calendar_account_id AND ca.user_id = auth.uid())
);
CREATE POLICY "Users update own external calendars" ON public.external_calendars FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.calendar_accounts ca WHERE ca.id = calendar_account_id AND ca.user_id = auth.uid())
);
CREATE POLICY "Users delete own external calendars" ON public.external_calendars FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.calendar_accounts ca WHERE ca.id = calendar_account_id AND ca.user_id = auth.uid())
);

CREATE TRIGGER update_external_calendars_updated_at BEFORE UPDATE ON public.external_calendars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- External event links: maps internal events to provider events
CREATE TABLE public.external_event_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_event_id uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_calendar_id text NOT NULL,
  provider_event_id text,
  last_synced_at timestamp with time zone,
  sync_state text NOT NULL DEFAULT 'pending' CHECK (sync_state IN ('pending', 'synced', 'conflict', 'error', 'deleted')),
  etag text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.external_event_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own event links" ON public.external_event_links FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.calendar_events ce WHERE ce.id = internal_event_id AND ce.user_id = auth.uid())
);
CREATE POLICY "Users insert own event links" ON public.external_event_links FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.calendar_events ce WHERE ce.id = internal_event_id AND ce.user_id = auth.uid())
);
CREATE POLICY "Users update own event links" ON public.external_event_links FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.calendar_events ce WHERE ce.id = internal_event_id AND ce.user_id = auth.uid())
);
CREATE POLICY "Users delete own event links" ON public.external_event_links FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.calendar_events ce WHERE ce.id = internal_event_id AND ce.user_id = auth.uid())
);

CREATE TRIGGER update_external_event_links_updated_at BEFORE UPDATE ON public.external_event_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add sync preference to calendar_events
ALTER TABLE public.calendar_events ADD COLUMN sync_preference text NOT NULL DEFAULT 'none' CHECK (sync_preference IN ('none', 'google', 'ics_feed', 'all'));

-- Add ICS feed token for private subscription URLs
ALTER TABLE public.profiles ADD COLUMN ics_feed_token text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN ics_feed_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN ics_feed_filter text NOT NULL DEFAULT 'all';
