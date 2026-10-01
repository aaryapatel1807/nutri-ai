// ---------------------------------------------------------------------------
// Pluggable outgoing-mail helper (currently used for password-reset emails).
//
// No email provider is configured yet, so this is a stub with two modes:
//
//   1. Development (default): logs the reset link to the server console.
//      Safe for local testing; the token never leaves the server logs.
//   2. Webhook: if MAILER_WEBHOOK_URL is set, POSTs { to, subject, text, html }
//      to that URL — point it at a small relay (e.g. a Cloudflare Worker that
//      calls the Resend free-tier API) when you want real emails.
//
// To send real email in production, wire a provider here (Resend/Brevo both
// have free tiers that need no card) and set the env vars it needs. The
// callers (routes/auth.js) only use `sendPasswordResetEmail()` /
// `sendEmail()`, so swapping the transport is a one-file change.
// ---------------------------------------------------------------------------

async function sendEmail({ to, subject, text, html }) {
  const webhook = process.env.MAILER_WEBHOOK_URL

  if (webhook) {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, text, html: html || text }),
    })
    if (!r.ok) throw new Error(`Mailer webhook failed (${r.status})`)
    return
  }

  // Development fallback — visible in Vercel function logs too.
  console.log('─── [mailer stub] outgoing email ───')
  console.log(`To:      ${to}`)
  console.log(`Subject: ${subject}`)
  console.log(`Body:\n${text}`)
  console.log('─── (configure MAILER_WEBHOOK_URL or a real provider to send) ───')
}

function frontendUrl() {
  return (process.env.FRONTEND_URL || 'https://nutriai-frontend-three.vercel.app').replace(/\/$/, '')
}

async function sendPasswordResetEmail(email, rawToken) {
  const link = `${frontendUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`
  await sendEmail({
    to: email,
    subject: 'Reset your NutriAI password',
    text:
      `You asked to reset your NutriAI password.\n\n` +
      `Use this link within 1 hour (single use):\n${link}\n\n` +
      `If you didn't ask for this, just ignore this email — your password won't change.`,
  })
}

module.exports = { sendEmail, sendPasswordResetEmail }
