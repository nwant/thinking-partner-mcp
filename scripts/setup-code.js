import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

async function setupClaudeCode() {
  console.log('🔧 Setting up Claude Code integration...');
  
  // Note: Claude Code configuration location may vary
  // This is an educated guess based on typical CLI tool patterns
  const possibleConfigPaths = [
    join(homedir(), '.claude', 'config.json'),
    join(homedir(), '.config', 'claude', 'config.json'),
    join(homedir(), '.claude-code', 'config.json')
  ];
  
  console.log('📍 Checking possible Claude Code config locations:');
  possibleConfigPaths.forEach(path => {
    const exists = existsSync(path);
    console.log(`  ${exists ? '✅' : '❌'} ${path}`);
  });
  
  // Try to find existing config or create in most likely location
  let configPath = possibleConfigPaths.find(path => existsSync(path));
  if (!configPath) {
    configPath = possibleConfigPaths[0]; // Default to ~/.claude/config.json
    console.log(`\n📝 No existing config found, will create at: ${configPath}`);
  }
  
  let config = {};
  
  if (existsSync(configPath)) {
    try {
      const existingConfig = await readFile(configPath, 'utf8');
      config = JSON.parse(existingConfig);
      console.log('📖 Loaded existing Claude Code config');
    } catch (error) {
      console.log('⚠️  Could not parse existing config, creating new one');
    }
  }
  
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  
  config.mcpServers['thinking-partner'] = {
    command: 'node',
    args: [join(process.cwd(), 'src', 'index.js')],
    env: {}
  };
  
  // Ensure directory exists
  const configDir = join(configPath, '..');
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }
  
  await writeFile(configPath, JSON.stringify(config, null, 2));
  console.log('✅ Claude Code configured');
  console.log(`Config written to: ${configPath}`);
  
  console.log('\n📋 MCP server configuration:');
  console.log(JSON.stringify(config.mcpServers['thinking-partner'], null, 2));
  
  console.log('\n💡 Note: If Claude Code uses a different config location,');
  console.log('   you may need to manually add this MCP server configuration');
  console.log('   to the correct config file.');
}

setupClaudeCode().catch(console.error);
