# Thinking Partner MCP

A Model Context Protocol (MCP) server that creates a unified AI thinking partner across Claude Desktop and Claude Code. This enables seamless context sharing and conversation continuity between architectural thinking and implementation work.

## Quick Start

```bash
# Install dependencies
npm install

# Test the server
npm test

# Configure Claude Desktop
npm run setup-desktop

# Configure Claude Code  
npm run setup-code

# Start development server
npm run dev
```

## The Magic Workflow

### Morning Design Session (Claude Desktop)
1. **Set Focus**: "I'm working on authentication system design"
2. **Architectural Discussion**: Explore approaches, make decisions
3. **Automatic Logging**: Design decisions captured with reasoning

### Implementation Session (Claude Code)
1. **Automatic Context**: Code tool knows your architectural decisions
2. **Implementation Discovery**: Log findings as you code
3. **Feedback Loop**: Implementation insights inform future design

### Next Day (Either Tool)
- **Complete Continuity**: Both tools remember your reasoning
- **Question Threading**: Open questions carry across sessions
- **Pattern Recognition**: Building long-term knowledge

## Available Tools

### `set_focus`
Set what you're currently working on - shared across both tools
```json
{
  "topic": "user authentication refactor",
  "context": "exploring JWT vs sessions",
  "tool": "desktop"
}
```

### `get_context` 
Retrieve relevant context for current conversation
```json
{
  "tool": "code",
  "scope": "current"
}
```

### `log_design_decision`
Capture architectural choices made in Desktop
```json
{
  "decision": "Use JWT with refresh tokens",
  "reasoning": "Better for distributed architecture",
  "alternatives": ["session cookies", "OAuth only"]
}
```

### `log_implementation_finding`
Record discoveries made during coding
```json
{
  "finding": "JWT library requires specific token structure",
  "code_context": "auth/token.js - jwt.sign() options"
}
```

### `bridge_conversation`
Connect conversations between Desktop and Code
```json
{
  "from_tool": "desktop",
  "to_tool": "code", 
  "summary": "Decided on JWT approach",
  "open_questions": ["How to handle token rotation?"]
}
```

## Project Structure

```
thinking-partner-mcp/
├── src/
│   ├── index.js          # Main MCP server
│   ├── storage.js        # JSON persistence layer  
│   └── tools.js          # Tool implementations
├── scripts/
│   ├── setup-desktop.js  # Claude Desktop config
│   ├── setup-code.js     # Claude Code config
│   └── test-server.js    # Server testing
├── data/
│   └── context.json      # Persistent context storage
└── package.json
```

## Configuration

The setup scripts automatically configure both Claude Desktop and Claude Code to use this MCP server. The server runs locally and maintains persistent context in `data/context.json`.

### Git Sync Configuration

The server supports automatic Git synchronization to share context across multiple machines:

```bash
# Copy example environment file
cp .env.example .env

# Edit .env to add your Git repository
THINKING_PARTNER_GIT_REMOTE=git@github.com:yourusername/thinking-partner-data.git
```

Environment variables:
- `THINKING_PARTNER_GIT_SYNC`: Enable/disable Git sync (default: true)
- `THINKING_PARTNER_AUTO_SYNC`: Enable/disable automatic sync on save (default: true)  
- `THINKING_PARTNER_GIT_REMOTE`: Git repository URL for syncing data

The server will automatically:
- Initialize a Git repository in the data directory
- Pull before reading context data
- Commit and push after saving changes
- Handle merge conflicts by preserving the most recent data

## Example Usage

**Desktop Session:**
```
User: "I'm designing a new API authentication system"
Claude: *sets focus and begins architectural discussion*
User: "Let's go with JWT tokens"
Claude: *logs decision with reasoning*
```

**Code Session:**
```
$ claude-code
Claude: "I see you're implementing the JWT auth system we designed. 
        The decision was based on distributed architecture needs..."
User: "I'm having trouble with token refresh"
Claude: *implementation-focused help*
*logs discovery about refresh token complexity*
```

**Next Desktop Session:**
```
Claude: "I notice from your implementation work that JWT refresh 
        tokens were more complex than expected. Should we 
        reconsider the architectural approach?"
```

## The Foundation

This tool creates a new collaborative thinking pattern where AI becomes an extension of your reflective process. Instead of isolated tool interactions, you develop a continuous dialogue that builds understanding over time.

The real power isn't in the individual features, but in the emerging cognitive partnership that develops through consistent use.

## Development

```bash
# Start with file watching
npm run dev

# Test the server 
npm test

# View current context
cat data/context.json | jq .
```

## Extending

The modular design makes it easy to add new tools, resources, or integrate with additional AI platforms. The storage layer can be enhanced with more sophisticated persistence or search capabilities as your context grows.
