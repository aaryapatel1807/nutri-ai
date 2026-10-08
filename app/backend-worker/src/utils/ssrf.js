// ─── SSRF guard for server-side URL fetches ──────────────────────────────────
// Port of the guard in app/backend/routes/recipes.js.
//
// Workers have no node:dns / node:net, so hostname resolution goes through
// DNS-over-HTTPS (Cloudflare's resolver, plain fetch). Every redirect hop is
// checked, which also closes the basic DNS-rebinding hole.

export function isBlockedIp(ip) {
  if (typeof ip !== 'string' || !ip) return true
  // IPv4
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (v4) {
    const [, a, b] = v4.map(Number)
    return (
      a === 10 || // 10.0.0.0/8
      a === 127 || // 127.0.0.0/8 loopback
      (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
      (a === 192 && b === 168) || // 192.168.0.0/16
      (a === 169 && b === 254) || // 169.254.0.0/16 link-local (cloud metadata)
      a === 0 // 0.0.0.0/8
    )
  }
  // IPv6
  const low = ip.toLowerCase()
  if (/^[0-9a-f:]+$/.test(low)) {
    return (
      low === '::1' || // loopback
      low === '::' ||
      low.startsWith('fc') ||
      low.startsWith('fd') || // fc00::/7 unique-local
      low.startsWith('fe80:') // fe80::/10 link-local
    )
  }
  return true // unparseable → block
}

async function dohLookup(hostname, type) {
  const r = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=${type}`,
    { headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(8000) }
  )
  if (!r.ok) throw new Error('DNS lookup failed')
  const j = await r.json()
  return (j.Answer || []).map((a) => String(a.data))
}

export async function assertPublicHost(hostname) {
  let addrs
  try {
    const [a, aaaa] = await Promise.all([
      dohLookup(hostname, 'A'),
      dohLookup(hostname, 'AAAA'),
    ])
    addrs = [...a, ...aaaa]
  } catch {
    throw new Error('Could not resolve that hostname')
  }
  if (!addrs.length || addrs.some(isBlockedIp)) {
    throw new Error('That URL resolves to a private or internal address')
  }
}

// Fetch with manual redirect handling (max 3 hops) so every hop's host is
// SSRF-checked — fetch()'s automatic redirects would skip the check.
export async function fetchPublicPage(rawUrl, timeoutMs = 10000) {
  let url = rawUrl
  for (let hop = 0; hop < 3; hop++) {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only http(s) URLs are supported')
    }
    await assertPublicHost(parsed.hostname)
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'manual',
      headers: { 'User-Agent': 'NutriAI/1.0 (recipe-import)' },
    })
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get('location')
      if (!loc) throw new Error('Redirect with no location')
      url = new URL(loc, url).toString()
      await res.arrayBuffer().catch(() => {}) // drain
      continue
    }
    return res
  }
  throw new Error('Too many redirects')
}

// Strip a fetched page down to readable text for the LLM.
export function htmlToText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}
