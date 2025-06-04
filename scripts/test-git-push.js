#!/usr/bin/env node

import 'dotenv/config';
import { Storage } from '../src/storage.js';
import { execSync } from 'child_process';

console.log('Testing Git push with actual remote...\n');

console.log('Environment variables:');
console.log('  THINKING_PARTNER_GIT_SYNC:', process.env.THINKING_PARTNER_GIT_SYNC);
console.log('  THINKING_PARTNER_AUTO_SYNC:', process.env.THINKING_PARTNER_AUTO_SYNC);
console.log('  THINKING_PARTNER_GIT_REMOTE:', process.env.THINKING_PARTNER_GIT_REMOTE);
console.log('');

// Create storage instance
const storage = new Storage();

// Add a test decision
console.log('Adding test decision...');
await storage.addDecision({
  decision: 'Test Git sync is working',
  reasoning: 'Testing automatic push to remote repository',
  topic: 'Git Based Sync'
});

console.log('\nChecking Git status...');
try {
  const status = execSync('git status --porcelain', { cwd: 'data' }).toString();
  console.log('Git status:', status || '(clean)');
  
  const log = execSync('git log --oneline -3', { cwd: 'data' }).toString();
  console.log('\nRecent commits:');
  console.log(log);
  
  // Check remote
  const remote = execSync('git remote -v', { cwd: 'data' }).toString();
  console.log('\nGit remote:');
  console.log(remote);
} catch (error) {
  console.error('Error checking Git:', error.message);
}

console.log('\n✅ Test complete! Check your remote repository for the new commit.');