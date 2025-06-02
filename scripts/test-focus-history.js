#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';
import { mkdtemp, rm, copyFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync } from 'fs';

async function testServer() {
  console.log('🧪 Testing focus history functionality...\n');

  // Create a temporary directory for test data
  const tempDir = await mkdtemp(join(tmpdir(), 'mcp-test-'));
  const testDataPath = join(tempDir, 'context.json');
  
  console.log(`📁 Using temporary test data at: ${tempDir}\n`);

  // Copy existing data if it exists (to preserve structure)
  const originalDataPath = 'data/context.json';
  if (existsSync(originalDataPath)) {
    await copyFile(originalDataPath, testDataPath);
  }

  const server = spawn('node', ['src/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { 
      ...process.env,
      // Override the data path to use test directory
      MCP_TEST_DATA_PATH: testDataPath
    }
  });

  let responseBuffer = '';
  let messageId = 1;

  server.stdout.on('data', (data) => {
    responseBuffer += data.toString();
  });

  server.stderr.on('data', (data) => {
    console.error('Server error:', data.toString());
  });

  async function sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: messageId++,
      method,
      params
    };
    
    server.stdin.write(JSON.stringify(request) + '\n');
    await setTimeout(100);
    
    const lines = responseBuffer.split('\n');
    const lastResponse = lines[lines.length - 2];
    
    if (lastResponse) {
      try {
        return JSON.parse(lastResponse);
      } catch (e) {
        console.error('Failed to parse response:', lastResponse);
        return null;
      }
    }
    return null;
  }

  try {
    // Initialize
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    });

    // Test 1: Set multiple focuses to build history
    console.log('1️⃣ Setting up focus history...');
    
    const focuses = [
      { topic: 'Authentication System', context: 'OAuth2 implementation', tool: 'desktop' },
      { topic: 'Database Migration', context: 'PostgreSQL upgrade', tool: 'code' },
      { topic: 'API Refactoring', context: 'REST to GraphQL', tool: 'desktop' }
    ];

    for (const focus of focuses) {
      const response = await sendRequest('tools/call', {
        name: 'set_focus',
        arguments: focus
      });
      console.log(`   ✅ Set focus: ${focus.topic}`);
      await setTimeout(100); // Small delay between focuses
    }

    // Test 2: Get context with scope='all' to check focus history
    console.log('\n2️⃣ Testing get_context with scope="all"...');
    const contextResponse = await sendRequest('tools/call', {
      name: 'get_context',
      arguments: { tool: 'desktop', scope: 'all' }
    });

    if (contextResponse?.result?.content?.[0]?.text) {
      const result = JSON.parse(contextResponse.result.content[0].text);
      console.log('   Current focus:', result.context.currentFocus?.topic || 'None');
      console.log('   Focus history included:', !!result.context.focusHistory);
      if (result.context.focusHistory) {
        console.log('   History entries:', result.context.focusHistory.length);
        result.context.focusHistory.forEach((f, i) => {
          console.log(`     ${i + 1}. ${f.topic} (${f.tool})`);
        });
      }
    }

    // Test 3: Get focus history using new tool
    console.log('\n3️⃣ Testing get_focus_history tool...');
    const historyResponse = await sendRequest('tools/call', {
      name: 'get_focus_history',
      arguments: { limit: 5 }
    });

    if (historyResponse?.result?.content?.[0]?.text) {
      const result = JSON.parse(historyResponse.result.content[0].text);
      console.log('   Success:', result.success);
      console.log('   Current focus:', result.currentFocus?.topic || 'None');
      console.log('   History entries:', result.history.length);
      result.history.forEach((f, i) => {
        console.log(`     ${i + 1}. ${f.topic} (${f.tool}) - Started: ${new Date(f.startedAt).toLocaleString()}`);
      });
    }

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    server.kill();
    
    // Cleanup temporary directory
    try {
      await rm(tempDir, { recursive: true, force: true });
      console.log(`\n🧹 Cleaned up temporary test data`);
    } catch (e) {
      console.error('Failed to cleanup temp directory:', e);
    }
    
    process.exit(0);
  }
}

testServer().catch(console.error);