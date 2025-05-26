#!/usr/bin/env node

import { spawn } from 'child_process';
import { readFile, access } from 'fs/promises';
import { join, resolve } from 'path';
import { homedir } from 'os';

console.log('🔍 Diagnosing Thinking Partner MCP Server\n');

async function checkFile(path, description) {
  try {
    await access(path);
    console.log(`✅ ${description}: ${path}`);
    return true;
  } catch (error) {
    console.log(`❌ ${description}: ${path} (not found)`);
    return false;
  }
}

async function testServerStartup() {
  console.log('\n🧪 Testing server startup...');
  
  return new Promise((resolve) => {
    const server = spawn('node', ['src/index.js'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stderr = '';
    let stdout = '';
    let hasError = false;

    server.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    server.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    server.on('error', (error) => {
      console.log(`❌ Server spawn error: ${error.message}`);
      hasError = true;
      resolve(false);
    });

    server.on('close', (code) => {
      if (stderr) {
        console.log('📋 Server stderr:', stderr);
      }
      if (stdout) {
        console.log('📋 Server stdout:', stdout);
      }
      
      if (code === 0 || stderr.includes('Thinking Partner MCP server running')) {
        console.log('✅ Server starts successfully');
        resolve(true);
      } else {
        console.log(`❌ Server exited with code: ${code}`);
        resolve(false);
      }
    });

    // Test initialization
    setTimeout(() => {
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'diagnostic', version: '1.0.0' }
        }
      };
      
      server.stdin.write(JSON.stringify(initRequest) + '\n');
    }, 100);

    // Kill after 2 seconds
    setTimeout(() => {
      server.kill();
    }, 2000);
  });
}

async function checkClaudeConfig() {
  console.log('\n🔧 Checking Claude Desktop configuration...');
  
  const configPath = join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  
  try {
    const configContent = await readFile(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    if (config.mcpServers && config.mcpServers['thinking-partner']) {
      console.log('✅ Thinking partner server found in Claude config');
      console.log('📋 Server config:');
      console.log(JSON.stringify(config.mcpServers['thinking-partner'], null, 2));
      
      // Check if the path is correct
      const serverCommand = config.mcpServers['thinking-partner'].command;
      const serverArgs = config.mcpServers['thinking-partner'].args;
      
      if (serverCommand === 'node' && serverArgs && serverArgs.length > 0) {
        const serverPath = serverArgs[0];
        const serverExists = await checkFile(serverPath, 'Server script path');
        
        if (!serverExists) {
          console.log('\n🔧 FIX: Server path in config is incorrect');
          console.log(`Expected: ${resolve(process.cwd(), 'src', 'index.js')}`);
          console.log(`Found: ${serverPath}`);
        }
      }
      
    } else {
      console.log('❌ Thinking partner server NOT found in Claude config');
      console.log('🔧 FIX: Run `npm run setup-desktop` again');
    }
    
  } catch (error) {
    console.log(`❌ Could not read Claude config: ${error.message}`);
    console.log('🔧 FIX: Run `npm run setup-desktop` to create config');
  }
}

async function diagnose() {
  console.log(`📂 Working directory: ${process.cwd()}`);
  console.log(`🏠 Home directory: ${homedir()}\n`);
  
  // Check essential files
  await checkFile('src/index.js', 'Main server file');
  await checkFile('src/storage.js', 'Storage module');
  await checkFile('src/tools.js', 'Tools module');
  await checkFile('package.json', 'Package configuration');
  await checkFile('node_modules/@modelcontextprotocol/sdk/package.json', 'MCP SDK');
  
  // Test server startup
  const serverWorks = await testServerStartup();
  
  // Check Claude config
  await checkClaudeConfig();
  
  console.log('\n📋 Summary:');
  if (serverWorks) {
    console.log('✅ MCP server can start successfully');
    console.log('🔧 If Claude Desktop still shows disconnected, try:');
    console.log('   1. Restart Claude Desktop completely');
    console.log('   2. Check that the config path is correct');
    console.log('   3. Look at Claude Desktop logs for specific errors');
  } else {
    console.log('❌ MCP server has startup issues');
    console.log('🔧 Fix server issues first, then reconfigure Claude Desktop');
  }
  
  console.log('\n💡 To manually test the server:');
  console.log('   npm run dev');
  console.log('   (Should show "Thinking Partner MCP server running")');
}

diagnose().catch(console.error);
