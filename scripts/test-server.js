import { spawn } from 'child_process';

function testServer() {
  console.log('🧪 Testing MCP server...');
  
  const server = spawn('node', ['src/index.js'], {
    stdio: ['pipe', 'pipe', 'inherit'],
    cwd: process.cwd()
  });
  
  let responseReceived = false;
  
  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        if (response.result && response.result.tools) {
          console.log('✅ Server responding correctly');
          console.log(`📊 Found ${response.result.tools.length} tools:`);
          response.result.tools.forEach(tool => {
            console.log(`  - ${tool.name}: ${tool.description}`);
          });
          responseReceived = true;
          server.kill();
          return;
        }
      } catch (error) {
        // Ignore parsing errors during startup
      }
    }
  });
  
  server.on('error', (error) => {
    console.log('❌ Server error:', error.message);
  });
  
  server.on('exit', (code) => {
    if (!responseReceived) {
      console.log('❌ Server exited without proper response');
    }
  });
  
  // Send a test MCP request to list tools
  const testRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };
  
  setTimeout(() => {
    server.stdin.write(JSON.stringify(testRequest) + '\n');
  }, 100);
  
  setTimeout(() => {
    if (!responseReceived) {
      console.log('❌ Server test timeout - no response received');
      server.kill();
    }
  }, 5000);
}

console.log('🚀 Starting MCP server test...');
testServer();
