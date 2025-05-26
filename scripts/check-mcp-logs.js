#!/usr/bin/env node

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

async function checkMCPLogs() {
  console.log('🔍 Checking actual MCP logs for errors...\n');
  
  const logFiles = [
    '/Users/nathan/Library/Logs/Claude/mcp.log',
    '/Users/nathan/Library/Logs/Claude/mcp-server-thinking-partner.log',
    '/Users/nathan/Library/Logs/Claude/mcp-server-filesystem.log'
  ];
  
  for (const logPath of logFiles) {
    console.log(`📂 Checking: ${logPath}`);
    
    if (existsSync(logPath)) {
      try {
        const content = await readFile(logPath, 'utf8');
        
        if (content.trim()) {
          console.log(`✅ Found content (${content.length} chars)`);
          console.log('📋 Recent entries:');
          console.log('---');
          
          // Show last 20 lines or recent errors
          const lines = content.split('\n');
          const recentLines = lines.slice(-20).filter(line => line.trim());
          
          if (recentLines.length > 0) {
            recentLines.forEach(line => console.log(line));
          } else {
            console.log('(No recent entries)');
          }
          
          console.log('---');
          
          // Look for specific error patterns
          const errors = lines.filter(line => 
            line.toLowerCase().includes('error') || 
            line.toLowerCase().includes('failed') ||
            line.toLowerCase().includes('disconnect') ||
            line.toLowerCase().includes('timeout')
          );
          
          if (errors.length > 0) {
            console.log('🚨 Found error patterns:');
            errors.slice(-5).forEach(error => console.log(`   ${error}`));
          }
          
        } else {
          console.log('📄 File exists but is empty');
        }
        
      } catch (error) {
        console.log(`❌ Could not read file: ${error.message}`);
      }
    } else {
      console.log('❌ File does not exist');
    }
    
    console.log('');
  }
  
  console.log('💡 To monitor MCP logs in real-time:');
  console.log('   tail -f /Users/nathan/Library/Logs/Claude/mcp-server-thinking-partner.log');
  console.log('   (in a separate terminal, then restart Claude Desktop)');
}

checkMCPLogs().catch(console.error);
