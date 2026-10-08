// ─── Pluggable outgoing-mail helper ─────────────────────────────────────────
// Port of app/backend/utils/mailer.js. No email provider is configured yet:
//   1. Development (default): logs the reset link to the console.
//   2. Webhook: if MAILER_WEBHOOK_URL is set, POSTs { to, subject, text, html }.
// Env is passed explicitly (Workers have no process.env).

export async function sendEmail(env, { to, subject, text, html }) {
  const webhook = env.MAILER_WEBHOOK_URL

  if (webhook) {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, text, html: html || text }),
    })
    if (!r.ok) throw new Error(`Mailer webhook failed (${r.status})`)
    return
  }

  console.log('─── [mailer stub] outgoing email ───')
  console.log(`To:      ${to}`)
  console.log(`Subject: ${subject}`)
  console.log(`Body:\n${text}`)
  console.log('─── (configure MAILER_WEBHOOK_URL or a real provider to send) ───')
}

export function frontendUrl(env) {
  return (env.FRONTEND_URL || 'https://nutriai-frontend-three.vercel.app').replace(/\/$/, '')
}

export async function sendPasswordResetEmail(env, email, rawToken) {
  const link = `${frontendUrl(env)}/reset-password?token=${encodeURIComponent(rawToken)}`
  await sendEmail(env, {
    to: email,
    subject: 'Reset your NutriAI password',
    text:
      `You asked to reset your NutriAI password.\n\n` +
      `Use this link within 1 hour (single use):\n${link}\n\n` +
      `If you didn't ask for this, just ignore this email — your password won't change.`,
  })
}
