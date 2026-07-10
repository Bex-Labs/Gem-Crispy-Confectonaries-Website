// ============================================================
// submit-enquiry
// Handles both the Contact page form and the Products page
// "Enquire Now" flow. Inserts the lead into `public.enquiries`
// and sends a notification email to the GEM team via Brevo's
// Transactional Email API.
//
// Required secrets (set with `supabase secrets set`):
//   BREVO_API_KEY       – your Brevo API key (shared with subscribe-newsletter)
//   NOTIFY_FROM_EMAIL   – verified Brevo sender email, e.g. "notifications@gemcrispy.com"
//   NOTIFY_FROM_NAME    – sender display name, e.g. "GEM Website"
//   NOTIFY_TO_EMAIL     – inbox that should receive new leads, e.g. "hello@gemcrispy.com"
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided
// automatically by the Supabase Edge Runtime — no need to set them.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EnquiryPayload {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  product_name?: string;
  type?: string;
}

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
    const payload: EnquiryPayload = await req.json();

    const name = (payload.name || "").trim();
    const email = (payload.email || "").trim();
    const message = (payload.message || "").trim();
    const phone = (payload.phone || "").trim() || null;
    const subject = (payload.subject || "General Inquiry").trim();
    const productName = (payload.product_name || "").trim() || null;
    const type = productName ? "product_enquiry" : "contact";

    // Server-side validation (never trust the client)
    if (name.length < 2 || !isValidEmail(email) || message.length < 10) {
      return new Response(JSON.stringify({ error: "Invalid submission." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: inserted, error: insertError } = await supabase
      .from("enquiries")
      .insert({
        type,
        name,
        email,
        phone,
        subject,
        message,
        product_name: productName,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Could not save enquiry." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send notification email via Brevo (best-effort — the lead is
    // already saved even if the email fails).
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const fromEmail = Deno.env.get("NOTIFY_FROM_EMAIL");
    const fromName = Deno.env.get("NOTIFY_FROM_NAME") || "GEM Website";
    const toEmail = Deno.env.get("NOTIFY_TO_EMAIL");

    if (brevoApiKey && fromEmail && toEmail) {
      try {
        const emailHtml = `
          <h2>New ${type === "product_enquiry" ? "Product Enquiry" : "Contact Form"} Submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          ${productName ? `<p><strong>Product:</strong> ${escapeHtml(productName)}</p>` : ""}
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
          <hr>
          <p style="color:#817661;font-size:12px;">Submitted via gemcrispy.com — enquiry ID ${inserted.id}</p>
        `;

        const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            sender: { name: fromName, email: fromEmail },
            to: [{ email: toEmail }],
            replyTo: { email, name },
            subject: `New ${type === "product_enquiry" ? "product enquiry" : "enquiry"}: ${subject}`,
            htmlContent: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          console.error("Brevo email error:", await emailResponse.text());
        }
      } catch (emailErr) {
        console.error("Failed to send notification email:", emailErr);
      }
    } else {
      console.warn("Brevo email secrets not configured — skipping email notification.");
    }

    return new Response(JSON.stringify({ success: true, id: inserted.id }), {
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}