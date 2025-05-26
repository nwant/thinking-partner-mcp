#!/usr/bin/env node

import { writeFile, mkdir, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

async function createSimpleTest() {
  console.log('🧪 Creating simplified MCP server test...\n');
  
  const testDir = join(homedir(), 'mcp-test');
  
  // Create test directory
  if (!existsSync(testDir)) {
    await mkdir(testDir, { recursive: true });
    console.log(`✅ Created test directory: ${testDir}`);
  }
  
  // Create minimal server
  const minimalServer = `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server({
  name: 'test-server',
  version: '1.0.0',
}, {
  capabilities: { tools: {} }
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'test_tool',
    description: 'A simple test tool',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  }]
}));

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Simple test server running');
`;

  const serverPath = join(testDir, 'server.js');
  await writeFile(serverPath, minimalServer);
  console.log(`✅ Created minimal server: ${serverPath}`);
  
  // Create package.json
  const packageJson = {
    "type": "module",
    "dependencies": {
      "@modelcontextprotocol/sdk": "^0.4.0"
    }
  };
  
  await writeFile(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  console.log(`✅ Created package.json`);
  
  // Update Claude Desktop config with simpler path
  const configPath = join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  
  const config = {
    "mcpServers": {
      "test-server": {
        "command": "node",
        "args": [serverPath],
        "cwd": testDir
      }
    }
  };
  
  await writeFile(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ Updated Claude Desktop config with simple test server`);
  
  console.log(`\n📋 Next steps:`);
  console.log(`1. cd ${testDir}`);
  console.log(`2. npm install`);
  console.log(`3. Restart Claude Desktop`);
  console.log(`4. Look for "test-server" with 1 tool called "test_tool"`);
  console.log(`\nIf this works, the issue is with our main server complexity.`);
  console.log(`If this doesn't work, the issue is with Claude Desktop MCP setup.`);
}

createSimpleTest().catch(console.error);
