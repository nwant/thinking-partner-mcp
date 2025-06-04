import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import GitSync from './git-sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class Storage {
  constructor() {
    // Check for test data path override
    if (process.env.MCP_TEST_DATA_PATH) {
      this.dataPath = process.env.MCP_TEST_DATA_PATH;
    } else {
      // Use the project root directory based on this file's location
      const projectRoot = dirname(__dirname);
      this.dataPath = join(projectRoot, 'data', 'context.json');
    }
    this.ensureDataDir();
    
    // Initialize Git sync
    const dataDir = dirname(this.dataPath);
    this.gitSync = new GitSync({
      dataPath: dataDir,
      enabled: process.env.THINKING_PARTNER_GIT_SYNC !== 'false',
      autoSync: process.env.THINKING_PARTNER_AUTO_SYNC !== 'false',
      remote: process.env.THINKING_PARTNER_GIT_REMOTE
    });
    this.gitSync.init();
  }

  async ensureDataDir() {
    const dir = dirname(this.dataPath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  async load() {
    try {
      // Pull latest changes before reading
      await this.gitSync.pull();
      
      if (!existsSync(this.dataPath)) {
        return this.getDefaultData();
      }
      const data = await readFile(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading data:', error);
      return this.getDefaultData();
    }
  }

  async save(data) {
    try {
      await writeFile(this.dataPath, JSON.stringify(data, null, 2));
      
      // Auto-commit and sync changes
      await this.gitSync.sync('Update context data');
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  getDefaultData() {
    return {
      currentFocus: null,
      focusHistory: [],
      conversations: {
        desktop: [],
        code: [],
        bridges: []
      },
      decisions: [],
      discoveries: [],
      patterns: []
    };
  }

  async getCurrentFocus() {
    const data = await this.load();
    return data.currentFocus;
  }

  async setCurrentFocus(focus) {
    const data = await this.load();
    
    // Archive previous focus if exists
    if (data.currentFocus) {
      data.focusHistory.unshift({
        ...data.currentFocus,
        endedAt: new Date().toISOString()
      });
    }
    
    data.currentFocus = {
      ...focus,
      startedAt: new Date().toISOString(),
      id: Date.now().toString()
    };
    
    await this.save(data);
    return data.currentFocus;
  }

  async addDecision(decision) {
    const data = await this.load();
    data.decisions.unshift({
      ...decision,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    });
    await this.save(data);
    return decision;
  }

  async addDiscovery(discovery) {
    const data = await this.load();
    data.discoveries.unshift({
      ...discovery,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    });
    await this.save(data);
    return discovery;
  }

  async addBridge(bridge) {
    const data = await this.load();
    data.conversations.bridges.unshift({
      ...bridge,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    });
    await this.save(data);
    return bridge;
  }

  async getContextForTool(tool, scope = 'current') {
    const data = await this.load();
    
    const context = {
      currentFocus: data.currentFocus,
      recentDecisions: data.decisions.slice(0, scope === 'current' ? 3 : 10),
      recentDiscoveries: data.discoveries.slice(0, scope === 'current' ? 3 : 10),
      conversationBridges: data.conversations.bridges.slice(0, 5)
    };

    // Include focus history when scope is 'all'
    if (scope === 'all') {
      context.focusHistory = data.focusHistory.slice(0, 10);
    }

    // Add tool-specific context
    if (tool === 'code' && data.currentFocus) {
      // For Code, emphasize implementation-relevant decisions
      context.implementationRelevant = data.decisions.filter(d => 
        d.topic === data.currentFocus.topic
      ).slice(0, 3);
    }

    if (tool === 'desktop' && data.discoveries.length > 0) {
      // For Desktop, surface recent implementation discoveries
      context.implementationFindings = data.discoveries.slice(0, 3);
    }

    return context;
  }

  async getConversationBridge() {
    const data = await this.load();
    return {
      currentFocus: data.currentFocus,
      recentBridges: data.conversations.bridges.slice(0, 3),
      pendingQuestions: data.conversations.bridges
        .flatMap(b => b.open_questions || [])
        .slice(0, 5)
    };
  }

  async getRecentDecisions() {
    const data = await this.load();
    return data.decisions.slice(0, 10);
  }

  async getFocusHistory(limit = 10) {
    const data = await this.load();
    return data.focusHistory.slice(0, limit);
  }
}
