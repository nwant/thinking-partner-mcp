#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataPath = join(dirname(__dirname), 'data', 'context.json');

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data from context.json...\n');

  try {
    // Read current data
    const data = JSON.parse(await readFile(dataPath, 'utf8'));
    
    // Test data topics to remove
    const testTopics = [
      'Authentication System',
      'Database Migration', 
      'API Refactoring'
    ];

    // Check if current focus is test data
    if (data.currentFocus && testTopics.includes(data.currentFocus.topic)) {
      console.log(`   ❌ Removing test focus: ${data.currentFocus.topic}`);
      
      // Restore the most recent non-test focus from history
      const validFocus = data.focusHistory.find(f => !testTopics.includes(f.topic));
      
      if (validFocus) {
        // Remove the endedAt since it's becoming current again
        delete validFocus.endedAt;
        data.currentFocus = validFocus;
        
        // Remove it from history to avoid duplication
        data.focusHistory = data.focusHistory.filter(f => f.id !== validFocus.id);
        console.log(`   ✅ Restored previous focus: ${validFocus.topic}`);
      } else {
        data.currentFocus = null;
        console.log('   ⚠️  No previous focus to restore');
      }
    }

    // Clean focus history
    const originalHistoryCount = data.focusHistory.length;
    data.focusHistory = data.focusHistory.filter(f => !testTopics.includes(f.topic));
    const removedCount = originalHistoryCount - data.focusHistory.length;
    
    if (removedCount > 0) {
      console.log(`   ✅ Removed ${removedCount} test entries from focus history`);
    }

    // Clean decisions (if any test decisions were made)
    if (data.decisions) {
      const originalDecisions = data.decisions.length;
      data.decisions = data.decisions.filter(d => 
        !d.topic || !testTopics.includes(d.topic)
      );
      const removedDecisions = originalDecisions - data.decisions.length;
      if (removedDecisions > 0) {
        console.log(`   ✅ Removed ${removedDecisions} test decisions`);
      }
    }

    // Clean discoveries (if any test discoveries were made)
    if (data.discoveries) {
      const originalDiscoveries = data.discoveries.length;
      data.discoveries = data.discoveries.filter(d => 
        !d.topic || !testTopics.includes(d.topic)
      );
      const removedDiscoveries = originalDiscoveries - data.discoveries.length;
      if (removedDiscoveries > 0) {
        console.log(`   ✅ Removed ${removedDiscoveries} test discoveries`);
      }
    }

    // Save cleaned data
    await writeFile(dataPath, JSON.stringify(data, null, 2));
    
    console.log('\n✅ Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupTestData().catch(console.error);