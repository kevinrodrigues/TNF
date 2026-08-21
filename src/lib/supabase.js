const URL = process.env.GRIDSOME_SUPABASE_URL
const KEY = process.env.GRIDSOME_SUPABASE_KEY
const SESSION_KEY = 'tnf_session'

function headers(token) {
  const h = { apikey: KEY, 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = 'Bearer ' + token
  return h
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function sendMagicLink(email, redirectTo) {
  const res = await fetch(URL + '/auth/v1/otp', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, create_user: true, options: { emailRedirectTo: redirectTo } }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.msg || err.message || 'Failed to send login link')
  }
}

export async function getUserFromToken(accessToken) {
  const res = await fetch(URL + '/auth/v1/user', { headers: headers(accessToken) })
  if (!res.ok) return null
  return res.json()
}

// Parse #access_token=...&... from the URL hash after magic link redirect
export function parseSessionFromHash() {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash || !hash.includes('access_token')) return null

  const params = new URLSearchParams(hash)
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  const expiresIn = parseInt(params.get('expires_in') || '3600', 10)
  if (!accessToken) return null

  history.replaceState(null, '', window.location.pathname + window.location.search)
  return { accessToken, refreshToken, expiresAt: Date.now() + expiresIn * 1000 }
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

// ── Votes ─────────────────────────────────────────────────────────────────────

export async function hasVoted(accessToken, userId) {
  const res = await fetch(
    URL + '/rest/v1/votes?select=id&voter_id=eq.' + userId,
    { headers: headers(accessToken) }
  )
  if (!res.ok) return false
  const rows = await res.json()
  return rows.length > 0
}

export async function submitVote(accessToken, userId, candidate) {
  const res = await fetch(URL + '/rest/v1/votes', {
    method: 'POST',
    headers: Object.assign(headers(accessToken), { Prefer: 'return=minimal' }),
    body: JSON.stringify({ voter_id: userId, candidate }),
  })

  if (res.ok || res.status === 201) return { success: true }

  const err = await res.json().catch(() => ({}))
  // Postgres unique constraint = already voted
  if (err.code === '23505') return { alreadyVoted: true }
  throw new Error(err.message || 'Failed to submit vote')
}
