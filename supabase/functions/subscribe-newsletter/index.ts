// ============================================================
// subscribe-newsletter
// Handles the "Subscribe" newsletter forms on Home, About, and
// Products pages. Upserts the subscriber into
// `public.newsletter_subscribers` and adds/updates the contact
// in a Brevo list.
//
// Required secrets (set with `supabase secrets set`):
//   BREVO_API_KEY   – your Brevo API key
//   BREVO_LIST_ID   – numeric ID of the Brevo list to add subscribers to
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided
// automatically by the Supabase Edge Runtime.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { email } = await req.json();
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return new Response(JSON.stringify({ error: "Invalid email address." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Upsert so re-subscribing an existing email doesn't error out.
    const { data: subscriber, error: upsertError } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        { email: cleanEmail, status: "active" },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return new Response(JSON.stringify({ error: "Could not save subscriber." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sync to Brevo (best-effort — subscriber is already saved in Supabase either way).
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const brevoListId = Deno.env.get("BREVO_LIST_ID");

    if (brevoApiKey && brevoListId) {
      try {
        const brevoResponse = await fetch("https://api.brevo.com/v3/contacts", {
          method: "POST",
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
            listIds: [Number(brevoListId)],
            updateEnabled: true,
          }),
        });

        // Brevo returns 204 for an update-in-place on an existing contact,
        // and 201 for a newly created contact. Both are success.
        if (brevoResponse.ok || brevoResponse.status === 204) {
          await supabase
            .from("newsletter_subscribers")
            .update({ brevo_synced_at: new Date().toISOString() })
            .eq("id", subscriber.id);
        } else {
          console.error("Brevo error:", await brevoResponse.text());
        }
      } catch (brevoErr) {
        console.error("Failed to sync to Brevo:", brevoErr);
      }
    } else {
      console.warn("Brevo secrets not configured — skipping Brevo sync.");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Unexpected server error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
