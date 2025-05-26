#!/usr/bin/env node

import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function fullTroubleshoot() {
  console.log('🚀 Full MCP Troubleshooting & Reset\n');
  
  // Step 1: Kill Claude Desktop
  console.log('1️⃣ Force closing Claude Desktop...');
  try {
    await execAsync('pkill -f Claude');
    console.log('✅ Claude Desktop closed');
  } catch (error) {
    console.log('ℹ️ Claude Desktop may not have been running');
  }
  
  // Step 2: Reconfigure with fresh settings
  console.log('\n2️⃣ Reconfiguring Claude Desktop...');
  const setup = spawn('node', ['scripts/setup-desktop.js'], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
  
  await new Promise((resolve) => {
    setup.on('close', resolve);
  });
  
  // Step 3: Test server once more
  console.log('\n3️⃣ Testing server startup...');
  const serverTest = spawn('node', ['scripts/test-server.js'], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
  
  await new Promise((resolve) => {
    serverTest.on('close', resolve);
  });
  
  // Step 4: Instructions
  console.log('\n4️⃣ Next steps:');
  console.log('✨ Now restart Claude Desktop manually');
  console.log('⏱️ Wait 10 seconds for full startup');
  console.log('🔍 Look for "thinking-partner" in MCP servers list');
  console.log('');
  console.log('💡 If still having issues:');
  console.log('   npm run logs     # Check Claude Desktop logs');
  console.log('   npm run dev      # Test server manually');
  console.log('');
  console.log('🎯 When working, you should see these tools available:');
  console.log('   - set_focus');
  console.log('   - get_context');
  console.log('   - log_design_decision');
  console.log('   - log_implementation_finding');
  console.log('   - bridge_conversation');
}

fullTroubleshoot().catch(console.error);
