// Netlify Function: GET /api/results
// Returns vote tallies (with voters) only when REVEAL_VOTES=true.
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify env vars.

exports.handler = async () => {
  if (process.env.REVEAL_VOTES !== 'true') {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Results are not yet available.' }),
    }
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfiguration.' }) }
  }

  const res = await fetch(`${url}/rest/v1/votes?select=candidate,voter_email`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })

  if (!res.ok) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Failed to fetch votes.' }) }
  }

  const rows = await res.json()

  // Group by candidate
  const tally = {}
  for (const { candidate, voter_email } of rows) {
    if (!tally[candidate]) tally[candidate] = { votes: 0, voters: [] }
    tally[candidate].votes++
    if (voter_email) tally[candidate].voters.push(voter_email)
  }

  const results = Object.entries(tally)
    .map(([name, data]) => ({ name, votes: data.votes, voters: data.voters }))
    .sort((a, b) => b.votes - a.votes)

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ results, total: rows.length }),
  }
}
