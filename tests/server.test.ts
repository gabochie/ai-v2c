import test from 'node:test';
import assert from 'node:assert/strict';
import { SecretManagerService } from '../src/server/utils/secretManager';
import { hashPassword, verifyPassword } from '../src/server/security/password';

test('SecretManagerService - maskSecret redacts credentials safely', () => {
  const secret = 'AIzaSyD-1234567890abcdefghijklm';
  const masked = SecretManagerService.maskSecret(secret);
  assert.strictEqual(masked.startsWith('AIza'), true);
  assert.strictEqual(masked.endsWith('jklm'), true);
  assert.strictEqual(masked.includes('••••••••'), true);
});

test('SecretManagerService - handles null/empty secret gracefully', () => {
  assert.strictEqual(SecretManagerService.maskSecret(null), 'Not Configured');
});

test('SecretManagerService - Audit Report returns structured statuses', () => {
  const report = SecretManagerService.getAuditReport();
  assert.strictEqual(Array.isArray(report), true);
  assert.strictEqual(report.some((r) => r.name === 'GEMINI_API_KEY'), true);
});

test('password - hash/verify roundtrip with timing-safe comparison', () => {
  const hash = hashPassword('correct horse battery staple');
  assert.notStrictEqual(hash, 'correct horse battery staple');
  assert.strictEqual(verifyPassword('correct horse battery staple', hash), true);
  assert.strictEqual(verifyPassword('wrong password', hash), false);
});

test('password - legacy plaintext marker no longer authenticates', () => {
  assert.strictEqual(verifyPassword('admin123', 'admin123_hash_scrypt_v1'), false);
});
