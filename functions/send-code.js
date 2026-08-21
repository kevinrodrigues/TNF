const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_KEY   = process.env.RESEND_API_KEY

function dbHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: 'Bearer ' + SERVICE_KEY,
    'Content-Type': 'application/json',
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 }

  let email
  try { ({ email } = JSON.parse(event.body || '{}')) } catch (_) {}
  if (!email) return { statusCode: 400, body: JSON.stringify({ error: 'Email required' }) }

  const code      = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  // Upsert code into otp_codes (overwrites any previous code for this email)
  const dbRes = await fetch(SUPABASE_URL + '/rest/v1/otp_codes', {
    method: 'POST',
    headers: Object.assign(dbHeaders(), { Prefer: 'resolution=merge-duplicates' }),
    body: JSON.stringify({ email, code, vote_token: null, expires_at: expiresAt }),
  })
  if (!dbRes.ok) return { statusCode: 500, body: JSON.stringify({ error: 'Failed to store code' }) }

  // Send via Resend
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'TNF League <onboarding@resend.dev>',
      to: [email],
      subject: 'Your TNF vote code',
      html: [
        '<div style="font-family:sans-serif;max-width:400px;margin:40px auto">',
        '<h2 style="margin:0 0 8px">TNF Vote</h2>',
        '<p style="opacity:.7;margin:0 0 24px">Your one-time login code:</p>',
        '<div style="font-size:42px;font-weight:700;letter-spacing:12px;color:#10c186">' + code + '</div>',
        '<p style="opacity:.5;font-size:13px;margin-top:24px">Expires in 10 minutes. Do not share this code.</p>',
        '</div>',
      ].join(''),
    }),
  })

  if (!emailRes.ok) {
    const err = await emailRes.json().catch(() => ({}))
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Failed to send email' }) }
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
