const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

function dbHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: 'Bearer ' + SERVICE_KEY,
    'Content-Type': 'application/json',
  }
}

function makeToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 }

  let email, code
  try { ({ email, code } = JSON.parse(event.body || '{}')) } catch (_) {}
  if (!email || !code) return { statusCode: 400, body: JSON.stringify({ error: 'Email and code required' }) }

  // Look up the stored code
  const res = await fetch(
    SUPABASE_URL + '/rest/v1/otp_codes?email=eq.' + encodeURIComponent(email) + '&select=code,expires_at',
    { headers: dbHeaders() }
  )
  const rows = await res.json()

  if (!rows.length || rows[0].code !== code) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid or expired code' }) }
  }
  if (new Date(rows[0].expires_at) < new Date()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Code has expired, please request a new one' }) }
  }

  // Exchange code for a vote token (valid 1 hour)
  const voteToken = makeToken()
  const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  await fetch(
    SUPABASE_URL + '/rest/v1/otp_codes?email=eq.' + encodeURIComponent(email),
    {
      method: 'PATCH',
      headers: dbHeaders(),
      body: JSON.stringify({ code: null, vote_token: voteToken, expires_at: tokenExpiry }),
    }
  )

  // Check if this email has already voted
  const voteRes = await fetch(
    SUPABASE_URL + '/rest/v1/votes?voter_email=eq.' + encodeURIComponent(email) + '&select=id',
    { headers: dbHeaders() }
  )
  const votes = await voteRes.json()

  return {
    statusCode: 200,
    body: JSON.stringify({ voteToken, email, hasVoted: votes.length > 0 }),
  }
}
