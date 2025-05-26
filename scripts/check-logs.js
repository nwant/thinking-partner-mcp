#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkClaudeLogs() {
  console.log('🔍 Checking Claude Desktop logs for MCP errors...\n');
  
  const logPaths = [
    '~/Library/Logs/Claude/main.log',
    '~/Library/Logs/Claude/renderer.log', 
    '~/Library/Application Support/Claude/logs/main.log',
    '~/Library/Application Support/Claude/logs/renderer.log'
  ];
  
  for (const logPath of logPaths) {
    try {
      console.log(`📂 Checking: ${logPath}`);
      const { stdout } = await execAsync(`ls -la ${logPath} 2>/dev/null || echo "Not found"`);
      
      if (!stdout.includes('Not found')) {
        console.log('✅ Found log file');
        
        // Get recent MCP-related entries
        try {
          const { stdout: logContent } = await execAsync(
            `tail -50 ${logPath} | grep -i -E "(mcp|thinking-partner|error|disconnect)" || echo "No MCP entries found"`
          );
          
          if (!logContent.includes('No MCP entries found')) {
            console.log('🚨 Recent MCP-related log entries:');
            console.log('---');
            console.log(logContent);
            console.log('---\n');
          }
        } catch (error) {
          console.log('Could not read log content');
        }
      } else {
        console.log('❌ Not found\n');
      }
    } catch (error) {
      console.log(`❌ Error checking ${logPath}: ${error.message}\n`);
    }
  }
  
  console.log('💡 To monitor logs in real-time while testing:');
  console.log('   tail -f ~/Library/Logs/Claude/main.log');
  console.log('   (in a separate terminal, then restart Claude Desktop)');
}

checkClaudeLogs().catch(console.error);
