import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

async function setupClaudeDesktop() {
  const configPath = join(
    homedir(),
    'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'
  );
  
  let config = {};
  
  // Load existing config if it exists
  if (existsSync(configPath)) {
    try {
      const existingConfig = await readFile(configPath, 'utf8');
      config = JSON.parse(existingConfig);
    } catch (error) {
      console.log('Could not parse existing config, creating new one');
    }
  }
  
  // Add our MCP server
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  
  const serverPath = join(process.cwd(), 'src', 'index.js');
  
  config.mcpServers['thinking-partner'] = {
    command: 'node',
    args: [serverPath],
    env: {},
    cwd: process.cwd()
  };
  
  await writeFile(configPath, JSON.stringify(config, null, 2));
  console.log('✅ Claude Desktop configured');
  console.log(`📁 Config written to: ${configPath}`);
  console.log(`🎯 Server path: ${serverPath}`);
  console.log(`📂 Working directory: ${process.cwd()}`);
  console.log('\n🔄 Restart Claude Desktop to use the thinking partner server');
  
  // Show current config for verification
  console.log('\n📋 Current MCP servers configured:');
  Object.keys(config.mcpServers || {}).forEach(serverName => {
    console.log(`  - ${serverName}`);
  });
}

setupClaudeDesktop().catch(console.error);
