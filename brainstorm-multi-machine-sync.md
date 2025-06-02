# Multi-Machine Context Sync Brainstorm

## Current Limitation
- Local JSON file (`data/context.json`) only accessible on one machine
- No built-in synchronization mechanism
- Context lost when switching between devices

## Solution Categories

### 1. Cloud Storage Solutions

#### **Dropbox/iCloud/Google Drive Sync**
- Store `context.json` in a synced folder
- Pros: Simple, no code changes needed
- Cons: Potential conflicts, requires manual setup

#### **S3-Compatible Storage**
- Use AWS S3, Cloudflare R2, or MinIO
- Pros: Reliable, versioning support
- Cons: Requires credentials, costs

#### **GitHub as Storage**
- Auto-commit context changes to a private repo
- Pros: Version history, conflict resolution
- Cons: Not ideal for frequent updates

### 2. Database Solutions

#### **Supabase/Firebase**
- Real-time sync database
- Pros: Real-time updates, built-in auth
- Cons: Requires account setup

#### **SQLite Cloud**
- Distributed SQLite (Turso, LiteFS)
- Pros: Familiar SQL, edge replication
- Cons: More complex than JSON

#### **Redis Cloud**
- In-memory store with persistence
- Pros: Fast, pub/sub for real-time
- Cons: Requires hosted instance

### 3. P2P/Decentralized Solutions

#### **IPFS**
- Content-addressed storage
- Pros: No central server needed
- Cons: Complex, slower

#### **Hypercore/Dat**
- P2P append-only logs
- Pros: Offline-first, conflict-free
- Cons: Learning curve

#### **WebRTC Direct Sync**
- Direct device-to-device sync
- Pros: No intermediary needed
- Cons: Devices must be online together

### 4. Hybrid Approaches

#### **Local + Cloud Backup**
```javascript
// Pseudocode
class HybridStorage {
  async save(data) {
    await saveLocal(data);
    await backupToCloud(data);
  }
  
  async load() {
    const local = await loadLocal();
    const cloud = await loadCloud();
    return merge(local, cloud);
  }
}
```

#### **Event Sourcing**
- Store changes as events, not state
- Sync events across devices
- Rebuild state from event log

### 5. Recommended Implementation Path

#### Phase 1: Environment-Based Storage
```javascript
// storage.js enhancement
const STORAGE_MODE = process.env.THINKING_PARTNER_STORAGE || 'local';

const storageProviders = {
  local: LocalFileStorage,
  s3: S3Storage,
  github: GitHubStorage,
  supabase: SupabaseStorage
};
```

#### Phase 2: Conflict Resolution
```javascript
// Handle concurrent updates
class ConflictResolver {
  merge(local, remote) {
    // Use timestamps
    // Merge arrays (decisions, discoveries)
    // Handle focus conflicts
  }
}
```

#### Phase 3: Sync Protocol
```javascript
// Periodic sync
setInterval(async () => {
  const local = await storage.load();
  const remote = await cloudStorage.load();
  const merged = resolver.merge(local, remote);
  await storage.save(merged);
}, 30000); // 30 seconds
```

## Quick Win: Git-Based Sync

Minimal changes required:
1. Store context in a git repo
2. Auto-commit on changes
3. Pull before read, push after write

```javascript
// storage.js addition
async function gitSync() {
  await exec('git pull --rebase');
  // ... existing save/load ...
  await exec('git add data/context.json');
  await exec('git commit -m "Update context"');
  await exec('git push');
}
```

## User Experience Considerations

1. **Transparent Sync**: User shouldn't need to think about it
2. **Offline Support**: Must work without internet
3. **Conflict Handling**: Graceful merge, no data loss
4. **Setup Simplicity**: Minimal configuration
5. **Privacy**: Option for self-hosted solutions

## Next Steps

1. Add `THINKING_PARTNER_STORAGE` environment variable
2. Implement storage provider interface
3. Start with Git-based sync as proof of concept
4. Add S3 provider for production use
5. Consider real-time sync for future