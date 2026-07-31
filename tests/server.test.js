import test from 'node:test';
import assert from 'node:assert/strict';
import { SecretManagerService } from '../dist/src/utils/secretManager.js';

test('SecretManagerService - maskSecret redacts credentials safely', () => {
  const secret = 'AIzaSyD-1234567890abcdefghijklm';
  const masked = SecretManagerService.maskSecret(secret);
  assert.strictEqual(masked.startsWith('AIza'), true);
  assert.strictEqual(masked.endsWith('jklm'), true);
  assert.strictEqual(masked.includes('••••••••'), true);
});

test('SecretManagerService - handles null/empty secret gracefully', () => {
  const maskedNull = SecretManagerService.maskSecret(null);
  assert.strictEqual(maskedNull, 'Not Configured');
});

test('SecretManagerService - Audit Report returns structured statuses', () => {
  const report = SecretManagerService.getAuditReport();
  assert.strictEqual(Array.isArray(report), true);
  assert.strictEqual(report.some((r) => r.name === 'GEMINI_API_KEY'), true);
});
