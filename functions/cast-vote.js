const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

function dbHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: 'Bearer ' + SERVICE_KEY,
    'Content-Type': 'application/json',
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 }

  let email, voteToken, candidate, voterName
  try { ({ email, voteToken, candidate, voterName } = JSON.parse(event.body || '{}')) } catch (_) {}
  if (!email || !voteToken || !candidate) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) }
  }

  // Verify the vote token is valid and not expired
  const tokenRes = await fetch(
    SUPABASE_URL + '/rest/v1/otp_codes?email=eq.' + encodeURIComponent(email) +
      '&vote_token=eq.' + encodeURIComponent(voteToken) + '&select=expires_at',
    { headers: dbHeaders() }
  )
  const tokens = await tokenRes.json()

  if (!tokens.length || new Date(tokens[0].expires_at) < new Date()) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Session expired, please sign in again' }) }
  }

  // Insert the vote
  const insertRes = await fetch(SUPABASE_URL + '/rest/v1/votes', {
    method: 'POST',
    headers: Object.assign(dbHeaders(), { Prefer: 'return=minimal' }),
    body: JSON.stringify({ voter_email: email, voter_name: voterName || null, candidate }),
  })

  if (insertRes.status === 409 || insertRes.status === 400) {
    return { statusCode: 200, body: JSON.stringify({ alreadyVoted: true }) }
  }
  if (!insertRes.ok) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to cast vote' }) }
  }

  // Invalidate the token after a successful vote
  await fetch(
    SUPABASE_URL + '/rest/v1/otp_codes?email=eq.' + encodeURIComponent(email),
    {
      method: 'PATCH',
      headers: dbHeaders(),
      body: JSON.stringify({ vote_token: null }),
    }
  )

  return { statusCode: 200, body: JSON.stringify({ success: true }) }
}
