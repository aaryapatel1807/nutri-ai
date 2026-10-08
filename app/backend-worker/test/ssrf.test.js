// Tests for utils/ssrf.js — the SSRF guard (no network; pure IP logic).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isBlockedIp } from '../src/utils/ssrf.js'

test('blocks IPv4 private ranges', () => {
  for (const ip of ['10.0.0.5', '10.255.255.255', '172.16.0.1', '172.31.255.1', '192.168.1.1']) {
    assert.equal(isBlockedIp(ip), true, ip)
  }
})

test('blocks loopback, link-local, and metadata addresses', () => {
  for (const ip of ['127.0.0.1', '127.1.2.3', '169.254.169.254', '0.0.0.0']) {
    assert.equal(isBlockedIp(ip), true, ip)
  }
})

test('allows public IPv4 addresses', () => {
  for (const ip of ['8.8.8.8', '1.1.1.1', '93.184.216.34', '172.32.0.1', '172.15.0.1']) {
    assert.equal(isBlockedIp(ip), false, ip)
  }
})

test('blocks IPv6 loopback, unique-local, and link-local', () => {
  for (const ip of ['::1', '::', 'fc00::1', 'fd12:3456::1', 'fe80::1']) {
    assert.equal(isBlockedIp(ip), true, ip)
  }
})

test('blocks garbage input', () => {
  assert.equal(isBlockedIp(''), true)
  assert.equal(isBlockedIp('not-an-ip'), true)
  assert.equal(isBlockedIp(null), true)
})
