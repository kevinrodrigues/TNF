// Only used for the live vote count — safe to call directly from the browser
const URL = process.env.GRIDSOME_SUPABASE_URL
const KEY = process.env.GRIDSOME_SUPABASE_KEY

export async function getVoteCount() {
  const res = await fetch(URL + '/rest/v1/rpc/get_vote_count', {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!res.ok) return 0
  return res.json()
}
