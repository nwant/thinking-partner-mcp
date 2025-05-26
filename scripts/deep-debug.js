#!/usr/bin/env node

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';

const execAsync = promisify(exec);

async function deepDebug() {
  console.log('🔍 Deep Debugging Claude Desktop MCP Connection\n');
  
  // Check if Claude Desktop is running
  console.log('1️⃣ Checking Claude Desktop processes...');
  try {
    const { stdout } = await execAsync('ps aux | grep -i claude | grep -v grep');
    if (stdout.trim()) {
      console.log('✅ Claude Desktop processes found:');
      console.log(stdout);
    } else {
      console.log('❌ No Claude Desktop processes found');
      console.log('🔧 Start Claude Desktop first, then try again');
      return;
    }
  } catch (error) {
    console.log('❌ Could not check processes');
  }
  
  // Find all possible log locations
  console.log('\n2️⃣ Searching for Claude Desktop logs...');
  const searchPaths = [
    '~/Library/Logs/Claude*',
    '~/Library/Application\\ Support/Claude*',
    '~/Library/Preferences/com.anthropic*',
    '~/Library/Caches/com.anthropic*',
    '/tmp/claude*',
    '~/.claude*'
  ];
  
  for (const searchPath of searchPaths) {
    try {
      const { stdout } = await execAsync(`find ${searchPath} -name "*.log" 2>/dev/null || echo ""`);
      if (stdout.trim()) {
        console.log(`✅ Found logs in ${searchPath}:`);
        console.log(stdout);
      }
    } catch (error) {
      // Ignore errors for paths that don't exist
    }
  }
  
  // Check system console logs for Claude
  console.log('\n3️⃣ Checking system console logs for Claude...');
  try {
    const { stdout } = await execAsync('log show --last 5m --predicate \'process contains "Claude"\' --info 2>/dev/null | tail -20');
    if (stdout.trim()) {
      console.log('📋 Recent Claude system logs:');
      console.log(stdout);
    } else {
      console.log('ℹ️ No recent Claude entries in system logs');
    }
  } catch (error) {
    console.log('ℹ️ Could not access system logs');
  }
  
  // Check the actual config file that was written
  console.log('\n4️⃣ Verifying Claude Desktop config...');
  try {
    const configPath = process.env.HOME + '/Library/Application Support/Claude/claude_desktop_config.json';
    const config = await readFile(configPath, 'utf8');
    const configObj = JSON.parse(config);
    
    console.log('📋 Current config file contents:');
    console.log(JSON.stringify(configObj, null, 2));
    
    if (configObj.mcpServers && configObj.mcpServers['thinking-partner']) {
      const serverConfig = configObj.mcpServers['thinking-partner'];
      console.log('\n✅ thinking-partner server found in config');
      
      // Test if the server path actually exists and is executable
      try {
        const serverPath = serverConfig.args[0];
        await execAsync(`test -f "${serverPath}"`);
        console.log(`✅ Server file exists: ${serverPath}`);
        
        // Test if we can execute it
        await execAsync(`node -c "${serverPath}"`);
        console.log('✅ Server file is valid Node.js');
        
      } catch (error) {
        console.log(`❌ Server file issue: ${error.message}`);
      }
    } else {
      console.log('❌ thinking-partner server NOT found in config');
    }
    
  } catch (error) {
    console.log(`❌ Could not read config: ${error.message}`);
  }
  
  // Try to connect to our server the way Claude Desktop would
  console.log('\n5️⃣ Testing MCP connection like Claude Desktop...');
  
  return new Promise((resolve) => {
    const server = spawn('node', ['src/index.js'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let initSuccess = false;
    let toolsSuccess = false;
    
    server.stdout.on('data', (data) => {
      const responses = data.toString().split('\n').filter(line => line.trim());
      
      for (const response of responses) {
        try {
          const parsed = JSON.parse(response);
          
          if (parsed.id === 1 && parsed.result && parsed.result.protocolVersion) {
            console.log('✅ Initialize handshake successful');
            initSuccess = true;
            
            // Now try to list tools
            const toolsRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/list',
              params: {}
            };
            server.stdin.write(JSON.stringify(toolsRequest) + '\n');
          }
          
          if (parsed.id === 2 && parsed.result && parsed.result.tools) {
            console.log(`✅ Tools list successful: ${parsed.result.tools.length} tools`);
            parsed.result.tools.forEach(tool => {
              console.log(`   - ${tool.name}`);
            });
            toolsSuccess = true;
          }
          
        } catch (error) {
          // Ignore parsing errors
        }
      }
    });
    
    server.stderr.on('data', (data) => {
      const stderr = data.toString();
      if (stderr.includes('Thinking Partner MCP server running')) {
        console.log('✅ Server startup message received');
        
        // Send initialize request
        const initRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'debug-client', version: '1.0.0' }
          }
        };
        
        setTimeout(() => {
          server.stdin.write(JSON.stringify(initRequest) + '\n');
        }, 100);
      }
    });
    
    server.on('error', (error) => {
      console.log(`❌ Server spawn error: ${error.message}`);
      resolve();
    });
    
    setTimeout(() => {
      server.kill();
      
      console.log('\n📋 Summary:');
      if (initSuccess && toolsSuccess) {
        console.log('✅ MCP server communication works perfectly');
        console.log('🔧 Issue is likely with Claude Desktop configuration or restart');
        console.log('\nTry this:');
        console.log('1. Completely quit Claude Desktop (⌘+Q)');
        console.log('2. Wait 10 seconds');
        console.log('3. Reopen Claude Desktop');
        console.log('4. Check MCP settings panel');
      } else {
        console.log('❌ MCP server communication has issues');
        console.log('🔧 Check server implementation');
      }
      
      resolve();
    }, 3000);
  });
}

deepDebug().catch(console.error);
