const URL = process.env.GRIDSOME_SUPABASE_URL
const KEY = process.env.GRIDSOME_SUPABASE_KEY
const SESSION_KEY = 'tnf_session'

function headers(token) {
  const h = { apikey: KEY, 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = 'Bearer ' + token
  return h
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function sendOtp(email) {
  const res = await fetch(URL + '/auth/v1/otp', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, create_user: true }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.msg || err.message || 'Failed to send code')
  }
}

export async function verifyOtp(email, token) {
  const res = await fetch(URL + '/auth/v1/verify', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, token, type: 'email' }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.msg || err.message || 'Invalid or expired code')
  }
  const data = await res.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    user: data.user,
  }
}

export function saveSession(session) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)) } catch (_) {}
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (s.expiresAt < Date.now()) { localStorage.removeItem(SESSION_KEY); return null }
    return s
  } catch (_) { return null }
}

export function clearSession() {
  try { localStorage.removeItem(SESSION_KEY) } catch (_) {}
}

export async function getUserFromToken(accessToken) {
  const res = await fetch(URL + '/auth/v1/user', { headers: headers(accessToken) })
  if (!res.ok) return null
  return res.json()
}

// ── Votes ─────────────────────────────────────────────────────────────────────

export async function getVoteCount() {
  const res = await fetch(URL + '/rest/v1/rpc/get_vote_count', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({}),
  })
  if (!res.ok) return 0
  return await res.json()
}

export async function hasVoted(accessToken, userId) {
  const res = await fetch(
    URL + '/rest/v1/votes?select=id&voter_id=eq.' + userId,
    { headers: headers(accessToken) }
  )
  if (!res.ok) return false
  const rows = await res.json()
  return rows.length > 0
}

export async function submitVote(accessToken, userId, voterEmail, candidate) {
  const res = await fetch(URL + '/rest/v1/votes', {
    method: 'POST',
    headers: Object.assign(headers(accessToken), { Prefer: 'return=minimal' }),
    body: JSON.stringify({ voter_id: userId, voter_email: voterEmail, candidate }),
  })

  if (res.ok || res.status === 201) return { success: true }

  const err = await res.json().catch(() => ({}))
  if (err.code === '23505') return { alreadyVoted: true }
  throw new Error(err.message || 'Failed to submit vote')
}
