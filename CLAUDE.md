# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm start` - Run the MCP server in production mode
- `npm run dev` - Run the MCP server with file watching (auto-reload)
- `npm test` - Test the server by spawning it and validating responses

### Setup
- `npm run setup-desktop` - Configure the server for Claude Desktop
- `npm run setup-code` - Configure the server for Claude Code

## Architecture

This is an MCP (Model Context Protocol) server that provides a unified thinking partner across Claude Desktop and Claude Code. The architecture follows a modular design:

### Core Components
- **index.js**: Main server entry point that implements MCP protocol handlers. Manages tool and resource endpoints, delegates to other modules.
- **storage.js**: Persistence layer using JSON file storage (`data/context.json`). Handles all read/write operations with atomic updates.
- **tools.js**: Pure function implementations for all MCP tools. Each tool returns structured data without side effects.

### Data Flow
1. Claude applications communicate via stdio transport using JSON-RPC
2. Server receives requests and routes to appropriate handlers
3. Tools process requests and update persistent storage
4. Resources serve read-only views of the stored data
5. All state changes are immediately persisted to disk

### Key Design Decisions
- **Stateless server**: All state lives in `data/context.json`
- **Atomic updates**: Storage operations use read-modify-write pattern
- **Pure tools**: Tool functions don't handle I/O directly
- **Unified context**: Single data structure shared across all tools
- **History preservation**: Focus changes and decisions are tracked with timestamps

## Testing

The project uses a custom test runner (`scripts/test-server.js`) that:
1. Spawns the MCP server as a child process
2. Sends JSON-RPC requests via stdin
3. Validates responses from stdout
4. Tests both successful operations and error cases

Run tests with: `npm test`

## Security Reminders
- Make sure no sensitive information is added to the git repository

## Memories
- Build everything in node