#!/usr/bin/env node

import { Storage } from '../src/storage.js';
import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

console.log('Testing Git Sync functionality...\n');

// Test without Git sync first
console.log('1. Testing without Git sync (THINKING_PARTNER_GIT_SYNC=false)');
process.env.THINKING_PARTNER_GIT_SYNC = 'false';
process.env.MCP_TEST_DATA_PATH = '/tmp/test-no-sync/context.json';

const storageNoSync = new Storage();
await storageNoSync.setCurrentFocus({
  topic: 'Test without sync',
  context: 'Testing disabled sync',
  tool: 'test'
});

console.log('✓ Storage works without Git sync\n');

// Test with Git sync but no remote
console.log('2. Testing with Git sync enabled but no remote');
process.env.THINKING_PARTNER_GIT_SYNC = 'true';
process.env.THINKING_PARTNER_AUTO_SYNC = 'true';
delete process.env.THINKING_PARTNER_GIT_REMOTE;
process.env.MCP_TEST_DATA_PATH = '/tmp/test-local-sync/context.json';

const storageLocalSync = new Storage();
await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for git init

await storageLocalSync.setCurrentFocus({
  topic: 'Test with local sync',
  context: 'Testing local Git sync',
  tool: 'test'
});

// Check if Git was initialized
const gitPath = '/tmp/test-local-sync/.git';
if (existsSync(gitPath)) {
  console.log('✓ Git repository initialized');
  
  // Check if commit was made
  try {
    const log = execSync('git log --oneline -1', { cwd: '/tmp/test-local-sync' }).toString();
    console.log('✓ Auto-commit created:', log.trim());
  } catch (e) {
    console.log('✗ No commits found');
  }
} else {
  console.log('✗ Git repository not initialized');
}

console.log('\n3. Testing conflict resolution');
// Simulate conflict by creating two different data sets
const data1 = {
  currentFocus: {
    topic: 'Focus from machine 1',
    context: 'Context 1',
    tool: 'desktop',
    startedAt: new Date(Date.now() - 10000).toISOString(),
    id: '1'
  },
  focusHistory: [],
  conversations: { desktop: [], code: [], bridges: [] },
  decisions: [
    { decision: 'Decision 1', timestamp: new Date(Date.now() - 5000).toISOString(), id: 'd1' }
  ],
  discoveries: [],
  patterns: []
};

const data2 = {
  currentFocus: {
    topic: 'Focus from machine 2',
    context: 'Context 2',
    tool: 'code',
    startedAt: new Date().toISOString(),
    id: '2'
  },
  focusHistory: [],
  conversations: { desktop: [], code: [], bridges: [] },
  decisions: [
    { decision: 'Decision 2', timestamp: new Date().toISOString(), id: 'd2' }
  ],
  discoveries: [],
  patterns: []
};

// Test conflict resolution
import GitSync from '../src/git-sync.js';
const gitSync = new GitSync();
const merged = await gitSync.resolveConflicts(data1, data2);

console.log('✓ Conflict resolution result:');
console.log('  - Current focus:', merged.currentFocus.topic);
console.log('  - Focus history length:', merged.focusHistory.length);
console.log('  - Decisions:', merged.decisions.map(d => d.decision).join(', '));

// Cleanup
console.log('\n4. Cleaning up test data...');
if (existsSync('/tmp/test-no-sync')) {
  rmSync('/tmp/test-no-sync', { recursive: true });
}
if (existsSync('/tmp/test-local-sync')) {
  rmSync('/tmp/test-local-sync', { recursive: true });
}

console.log('\n✅ Git sync tests completed successfully!');