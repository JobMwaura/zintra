import { serve } from "https://zeomgqlnztcdqtespsjx.functions.supabase.co";

serve(async (req) => {
  try {
    const { record } = await req.json();

    const email = record.email;
    const company = record.company_name || "Your Business";
    const plan = record.plan || "premium";

    console.log(`📧 Sending welcome email to: ${email}`);

    // Send email using Supabase built-in mailer
    const res = await fetch("https://api.supabase.com/v1/mailer/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: email,
        subject: `Welcome to Zintra, ${company}!`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height:1.6;">
            <h2>Welcome to Zintra Marketplace 🎉</h2>
            <p>Hi <strong>${company}</strong>,</p>
            <p>We’re excited to have you join our platform! You’re now part of a growing community of trusted vendors helping customers find reliable construction and event services.</p>
            <p>Your plan: <strong style="color:#ea8f1e;">${plan.toUpperCase()}</strong></p>
            <p>Next steps:</p>
            <ul>
              <li>✅ Complete your profile and add more portfolio images</li>
              <li>📊 Respond to RFQs in your category</li>
              <li>💬 Engage with customers through your dashboard</li>
            </ul>
            <p>Login anytime at <a href="https://zintra.app" style="color:#ea8f1e;">zintra.app</a> to manage your vendor profile.</p>
            <br>
            <p>Warm regards,</p>
            <p><strong>The Zintra Team</strong><br>
            <a href="https://zintra.app">www.zintra.app</a></p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.error("❌ Error sending email:", await res.text());
      return new Response("Failed to send email", { status: 500 });
    }

    console.log(`✅ Welcome email sent successfully to ${email}`);
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("❌ Function error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});