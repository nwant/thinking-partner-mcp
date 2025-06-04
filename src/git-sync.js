import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

class GitSync {
  constructor(config = {}) {
    this.dataPath = config.dataPath || join(__dirname, '..', 'data');
    this.contextFile = 'context.json';
    this.remote = config.remote || process.env.THINKING_PARTNER_GIT_REMOTE || null;
    this.branch = config.branch || 'main';
    this.enabled = config.enabled !== false;
    this.autoSync = config.autoSync !== false;
  }

  async init() {
    if (!this.enabled) return;

    try {
      const gitPath = join(this.dataPath, '.git');
      if (!existsSync(gitPath)) {
        await this.execGit('init');
        await this.execGit('config user.name "Thinking Partner MCP"');
        await this.execGit('config user.email "noreply@thinking-partner.local"');
        
        if (this.remote) {
          await this.execGit(`remote add origin ${this.remote}`);
        }
      }
    } catch (error) {
      console.error('Git init failed:', error.message);
    }
  }

  async execGit(command) {
    try {
      const { stdout, stderr } = await execAsync(`git ${command}`, {
        cwd: this.dataPath
      });
      if (stderr && !stderr.includes('Already up to date')) {
        console.error('Git stderr:', stderr);
      }
      return stdout;
    } catch (error) {
      if (error.message.includes('no upstream branch')) {
        await execAsync(`git push -u origin ${this.branch}`, { cwd: this.dataPath });
        return await execAsync(`git ${command}`, { cwd: this.dataPath });
      }
      throw error;
    }
  }

  async pull() {
    if (!this.enabled || !this.remote) return;

    try {
      await this.execGit('fetch origin');
      const status = await this.execGit('status --porcelain');
      
      if (status.trim()) {
        await this.execGit('stash push -m "Auto-stash before pull"');
        await this.execGit(`pull --rebase origin ${this.branch}`);
        await this.execGit('stash pop');
      } else {
        await this.execGit(`pull --rebase origin ${this.branch}`);
      }
    } catch (error) {
      console.error('Git pull failed:', error.message);
    }
  }

  async commit(message = 'Update context') {
    if (!this.enabled) return;

    try {
      await this.execGit(`add ${this.contextFile}`);
      
      const status = await this.execGit('status --porcelain');
      if (!status.trim()) return;
      
      const timestamp = new Date().toISOString();
      const fullMessage = `${message} [${timestamp}]`;
      await this.execGit(`commit -m "${fullMessage}"`);
    } catch (error) {
      console.error('Git commit failed:', error.message);
    }
  }

  async push() {
    if (!this.enabled || !this.remote) return;

    try {
      await this.execGit(`push origin ${this.branch}`);
    } catch (error) {
      console.error('Git push failed:', error.message);
    }
  }

  async sync(message = 'Update context') {
    if (!this.autoSync) return;

    await this.pull();
    await this.commit(message);
    await this.push();
  }

  async resolveConflicts(localData, remoteData) {
    const merged = {
      currentFocus: null,
      focusHistory: [],
      conversations: { desktop: [], code: [], bridges: [] },
      decisions: [],
      discoveries: [],
      patterns: []
    };

    if (localData.currentFocus && remoteData.currentFocus) {
      const localTime = new Date(localData.currentFocus.startedAt).getTime();
      const remoteTime = new Date(remoteData.currentFocus.startedAt).getTime();
      
      if (localTime > remoteTime) {
        merged.currentFocus = localData.currentFocus;
        merged.focusHistory.push({
          ...remoteData.currentFocus,
          endedAt: new Date().toISOString()
        });
      } else {
        merged.currentFocus = remoteData.currentFocus;
        merged.focusHistory.push({
          ...localData.currentFocus,
          endedAt: new Date().toISOString()
        });
      }
    } else {
      merged.currentFocus = localData.currentFocus || remoteData.currentFocus;
    }

    merged.focusHistory = this.mergeArraysByTimestamp(
      [...(localData.focusHistory || []), ...(remoteData.focusHistory || [])]
    );

    merged.decisions = this.mergeArraysByTimestamp(
      [...(localData.decisions || []), ...(remoteData.decisions || [])]
    );

    merged.discoveries = this.mergeArraysByTimestamp(
      [...(localData.discoveries || []), ...(remoteData.discoveries || [])]
    );

    merged.patterns = [...new Set([
      ...(localData.patterns || []),
      ...(remoteData.patterns || [])
    ])];

    merged.conversations.desktop = this.mergeArraysByTimestamp(
      [...(localData.conversations?.desktop || []), ...(remoteData.conversations?.desktop || [])]
    );

    merged.conversations.code = this.mergeArraysByTimestamp(
      [...(localData.conversations?.code || []), ...(remoteData.conversations?.code || [])]
    );

    merged.conversations.bridges = this.mergeArraysByTimestamp(
      [...(localData.conversations?.bridges || []), ...(remoteData.conversations?.bridges || [])]
    );

    return merged;
  }

  mergeArraysByTimestamp(items) {
    const seen = new Set();
    return items
      .filter(item => {
        const key = item.id || `${item.timestamp}-${item.decision || item.discovery || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp || a.startedAt || a.endedAt || 0).getTime();
        const timeB = new Date(b.timestamp || b.startedAt || b.endedAt || 0).getTime();
        return timeB - timeA;
      });
  }
}

export default GitSync;