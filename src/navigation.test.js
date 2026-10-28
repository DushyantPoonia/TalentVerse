import test from 'node:test';
import assert from 'node:assert/strict';
import { scrollToHash } from './navigation.js';

test('scrolls to an existing hash target', () => {
  let scrolled = false;
  const target = { scrollIntoView: () => { scrolled = true; } };
  const documentRef = { getElementById: (id) => id === 'how-it-works' ? target : null };

  assert.equal(scrollToHash('#how-it-works', documentRef), true);
  assert.equal(scrolled, true);
});

test('does not scroll when the hash is empty or the target is missing', () => {
  const documentRef = { getElementById: () => null };

  assert.equal(scrollToHash('', documentRef), false);
  assert.equal(scrollToHash('#', documentRef), false);
  assert.equal(scrollToHash('#unknown', documentRef), false);
});
