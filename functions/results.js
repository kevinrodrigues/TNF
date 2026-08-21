// Netlify Function: GET /api/results
// Returns vote tallies only when REVEAL_VOTES=true.
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify env vars.

exports.handler = async () => {
  if (process.env.REVEAL_VOTES !== 'true') {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Voting is still open. Results are not yet available.' }),
    }
  }

  const url  = process.env.SUPABASE_URL
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server misconfiguration.' }),
    }
  }

  const res = await fetch(`${url}/rest/v1/votes?select=candidate`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  })

  if (!res.ok) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Failed to fetch votes.' }),
    }
  }

  const rows = await res.json()

  // Tally votes per candidate
  const tally = {}
  for (const { candidate } of rows) {
    tally[candidate] = (tally[candidate] || 0) + 1
  }

  const results = Object.entries(tally)
    .map(([name, votes]) => ({ name, votes }))
    .sort((a, b) => b.votes - a.votes)

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ results, total: rows.length }),
  }
}
