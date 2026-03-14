import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Check for upcoming task and calendar event reminders.
 * Called by pg_cron or service-role only.
 *
 * Security: Validates the caller is using the service role key.
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // --- Auth: require service role key ---
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(
      JSON.stringify({ error: "Unauthorized. This function requires service-role access." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const results: { type: string; title: string; userId: string }[] = [];

    // --- Calendar event reminders ---
    const { data: calendarEvents } = await supabase
      .from("calendar_events")
      .select("*")
      .not("reminder_minutes", "is", null)
      .gte("event_date", now.toISOString().split("T")[0]);

    if (calendarEvents) {
      for (const event of calendarEvents) {
        const eventDateTime = new Date(
          `${event.event_date}T${event.event_time || "09:00"}:00Z`
        );
        const reminderTime = new Date(
          eventDateTime.getTime() - (event.reminder_minutes || 30) * 60 * 1000
        );

        const diffMs = Math.abs(now.getTime() - reminderTime.getTime());
        if (diffMs < 60 * 1000) {
          const minutesLabel = event.reminder_minutes >= 60
            ? `${Math.round(event.reminder_minutes / 60)} hour(s)`
            : `${event.reminder_minutes} minutes`;

          await fetch(`${supabaseUrl}/functions/v1/push-notify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              user_id: event.user_id,
              title: `📅 ${event.title}`,
              body: `Coming up in ${minutesLabel}`,
              url: "/calendar",
              tag: `calendar-${event.id}`,
            }),
          });

          results.push({
            type: "calendar",
            title: event.title,
            userId: event.user_id,
          });
        }
      }
    }

    // --- Task reminders ---
    const { data: taskItems } = await supabase
      .from("tasks")
      .select("*")
      .eq("is_completed", false)
      .is("archived_at", null)
      .not("reminder_minutes", "is", null)
      .not("due_date", "is", null);

    if (taskItems) {
      for (const task of taskItems) {
        const taskDateTime = new Date(`${task.due_date}T09:00:00Z`);
        const reminderTime = new Date(
          taskDateTime.getTime() - (task.reminder_minutes || 30) * 60 * 1000
        );

        const diffMs = Math.abs(now.getTime() - reminderTime.getTime());
        if (diffMs < 60 * 1000) {
          const minutesLabel = task.reminder_minutes >= 60
            ? `${Math.round(task.reminder_minutes / 60)} hour(s)`
            : `${task.reminder_minutes} minutes`;

          await fetch(`${supabaseUrl}/functions/v1/push-notify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              user_id: task.user_id,
              title: `✅ ${task.title}`,
              body: `Due in ${minutesLabel}`,
              url: "/tasks",
              tag: `task-${task.id}`,
            }),
          });

          results.push({
            type: "task",
            title: task.title,
            userId: task.user_id,
          });
        }
      }
    }

    console.log(`Check-reminders: sent ${results.length} notifications`, results);

    return new Response(
      JSON.stringify({ sent: results.length, details: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Check reminders error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
