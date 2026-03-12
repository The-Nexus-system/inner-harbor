import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun
    const dayOfMonth = now.getUTCDate();

    // Reset daily recurring tasks
    const { data: dailyReset, error: dailyErr } = await supabase
      .from("tasks")
      .update({ is_completed: false })
      .eq("is_completed", true)
      .eq("is_recurring", true)
      .eq("recurrence_pattern", "daily")
      .is("archived_at", null)
      .select("id");

    if (dailyErr) console.error("Daily reset error:", dailyErr.message);

    // Reset weekly recurring tasks on Monday (day 1)
    let weeklyReset: any[] = [];
    if (dayOfWeek === 1) {
      const { data, error } = await supabase
        .from("tasks")
        .update({ is_completed: false })
        .eq("is_completed", true)
        .eq("is_recurring", true)
        .eq("recurrence_pattern", "weekly")
        .is("archived_at", null)
        .select("id");

      if (error) console.error("Weekly reset error:", error.message);
      weeklyReset = data ?? [];
    }

    // Reset monthly recurring tasks on the 1st
    let monthlyReset: any[] = [];
    if (dayOfMonth === 1) {
      const { data, error } = await supabase
        .from("tasks")
        .update({ is_completed: false })
        .eq("is_completed", true)
        .eq("is_recurring", true)
        .eq("recurrence_pattern", "monthly")
        .is("archived_at", null)
        .select("id");

      if (error) console.error("Monthly reset error:", error.message);
      monthlyReset = data ?? [];
    }

    const summary = {
      daily: dailyReset?.length ?? 0,
      weekly: weeklyReset.length,
      monthly: monthlyReset.length,
      timestamp: now.toISOString(),
    };

    console.log("Recurring task reset summary:", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Reset recurring tasks error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
