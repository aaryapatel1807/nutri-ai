// SSRF guard tests — no network needed (pure IP checks + mock streams).
// Run: node --test test/ssrf.test.js
// Note: redirect-to-private and oversized-live-page behavior are verified
// separately against a public redirector (see Phase 3 report), because every
// local address is itself blocked by the guard and cannot serve as hop 1.
const { describe, it } = require('node:test')
const assert = require('node:assert')
const { isBlockedIp, assertPublicHost, readCappedBody } = require('../routes/recipes')

describe('isBlockedIp', () => {
  const blocked = [
    // IPv4: loopback / private / link-local / CGNAT / benchmarking / reserved
    '127.0.0.1', '127.9.8.7', '10.0.0.5', '10.255.255.255',
    '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254',
    '0.0.0.0', '100.64.0.1', '100.127.255.255', '198.18.0.1', '198.19.0.2',
    '192.0.0.1', '192.0.2.1', '240.0.0.1', '255.255.255.255',
    // IPv6: loopback / unspecified / ULA / link-local (full fe80::/10 range)
    '::1', '::', 'fc00::1', 'fd12:3456::1', 'fe80::1', 'fe81::1',
    'fe90::1', 'fea0::1', 'febf::1', '2001:db8::1',
    // IPv6 transition forms embedding a blocked IPv4
    '::ffff:127.0.0.1', '::ffff:10.0.0.1', '::ffff:192.168.0.1',
    '64:ff9b::169.254.169.254', '2002:7f00:0001::', '2002:a9fe:a9fe::',
    '::ffff:0:127.0.0.1',
  ]
  for (const ip of blocked) {
    it(`blocks ${ip}`, () => assert.equal(isBlockedIp(ip), true))
  }

  const allowed = [
    '8.8.8.8', '1.1.1.1', '93.184.216.34', '172.32.0.1', '100.128.0.1',
    '198.20.0.1', '192.1.0.1',
    '2606:4700:4700::1111', '2a00:1450:4001:800::200e', '2001:4860:4860::8888',
    // Transition forms embedding a PUBLIC IPv4 must pass
    '::ffff:8.8.8.8', '64:ff9b::8.8.8.8', '2002:0808:0808::',
  ]
  for (const ip of allowed) {
    it(`allows ${ip}`, () => assert.equal(isBlockedIp(ip), false))
  }

  it('blocks unparseable input', () => {
    assert.equal(isBlockedIp('not-an-ip'), true)
    assert.equal(isBlockedIp(''), true)
    assert.equal(isBlockedIp('999.1.1.1'), true)
  })
})

describe('assertPublicHost', () => {
  it('rejects localhost (resolves to loopback)', async () => {
    await assert.rejects(() => assertPublicHost('localhost'), /private or internal/)
  })
  it('rejects unresolvable hostnames', async () => {
    await assert.rejects(() => assertPublicHost('nonexistent.invalid'), /resolve/)
  })
})

describe('readCappedBody', () => {
  const mockResponse = (chunks) => ({
    body: {
      getReader: () => {
        let i = 0
        return {
          read: async () => (i < chunks.length
            ? { done: false, value: chunks[i++] }
            : { done: true, value: undefined }),
          cancel: async () => {},
          releaseLock: () => {},
        }
      },
    },
  })
  const enc = (s) => new TextEncoder().encode(s)

  it('returns the body when under the cap', async () => {
    const buf = await readCappedBody(mockResponse([enc('hello '), enc('world')]), 1024)
    assert.equal(buf.toString('utf8'), 'hello world')
  })

  it('throws as soon as the cap is passed, without consuming the rest', async () => {
    const big = enc('x'.repeat(3000))
    await assert.rejects(() => readCappedBody(mockResponse([enc('ok'), big, enc('never-read')]), 1024),
      /too large/)
  })

  it('accepts exactly the cap', async () => {
    const buf = await readCappedBody(mockResponse([enc('x'.repeat(100))]), 100)
    assert.equal(buf.length, 100)
  })
})
