#!/usr/bin/env node

import { writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';

async function quickFix() {
  console.log('🔧 Applying quick fix for common MCP issues...\n');
  
  const configPath = join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  
  try {
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    
    // Fix 1: Use npx instead of direct node (like filesystem server)
    console.log('🔧 Fix 1: Switching to npx execution...');
    const originalConfig = { ...config.mcpServers['thinking-partner'] };
    
    config.mcpServers['thinking-partner'] = {
      command: 'npx',
      args: ['--yes', '--node-options="--no-warnings"', 'node', join(process.cwd(), 'src', 'index.js')],
      cwd: process.cwd(),
      env: {}
    };
    
    await writeFile(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Updated config to use npx');
    
    console.log('\n📋 New thinking-partner config:');
    console.log(JSON.stringify(config.mcpServers['thinking-partner'], null, 2));
    
    console.log('\n🔄 Now restart Claude Desktop and check if it works');
    console.log('💡 If this doesn\'t work, run: npm run mcp-logs');
    
  } catch (error) {
    console.log(`❌ Could not apply fix: ${error.message}`);
  }
}

quickFix().catch(console.error);
