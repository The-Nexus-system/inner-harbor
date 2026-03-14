import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Google Calendar sync — list and insert events.
 *
 * Security: Validates the caller is an authenticated Supabase user via getClaims().
 * The Google OAuth token is passed through from the client.
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth: validate Supabase JWT ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized — invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Google API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, calendarId, event, timeMin, timeMax, googleAccessToken } = await req.json();

    if (!googleAccessToken) {
      return new Response(JSON.stringify({ error: 'Google OAuth access token is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId || 'primary')}`;
    const googleAuth = `Bearer ${googleAccessToken}`;

    if (action === 'list') {
      const params = new URLSearchParams({
        key: GOOGLE_API_KEY,
        singleEvents: 'true',
        orderBy: 'startTime',
      });
      if (timeMin) params.set('timeMin', timeMin);
      if (timeMax) params.set('timeMax', timeMax);

      const res = await fetch(`${baseUrl}/events?${params}`, {
        headers: { Authorization: googleAuth },
      });
      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: `Google API error [${res.status}]: ${JSON.stringify(data)}` }), {
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'insert') {
      const res = await fetch(`${baseUrl}/events`, {
        method: 'POST',
        headers: {
          Authorization: googleAuth,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: `Google API error [${res.status}]: ${JSON.stringify(data)}` }), {
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use "list" or "insert".' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
