import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { Storage } from './storage.js';
import { createTools } from './tools.js';

class ThinkingPartnerServer {
  constructor() {
    this.server = new Server({
      name: 'thinking-partner',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
        resources: {}
      }
    });
    
    this.storage = new Storage();
    this.tools = createTools(this.storage);
    
    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'set_focus',
          description: 'Set current working focus - shared across Desktop and Code',
          inputSchema: {
            type: 'object',
            properties: {
              topic: { type: 'string', description: 'What you\'re working on' },
              context: { type: 'string', description: 'Additional context' },
              tool: { type: 'string', enum: ['desktop', 'code'], description: 'Which tool you\'re using' }
            },
            required: ['topic', 'tool']
          }
        },
        {
          name: 'get_context',
          description: 'Get relevant context for current conversation',
          inputSchema: {
            type: 'object',
            properties: {
              tool: { type: 'string', enum: ['desktop', 'code'], description: 'Which tool is requesting' },
              scope: { type: 'string', enum: ['current', 'recent', 'all'], default: 'current' }
            },
            required: ['tool']
          }
        },
        {
          name: 'log_design_decision',
          description: 'Capture architectural decisions made in Desktop',
          inputSchema: {
            type: 'object',
            properties: {
              decision: { type: 'string', description: 'The decision made' },
              reasoning: { type: 'string', description: 'Why this decision' },
              alternatives: { type: 'array', items: { type: 'string' }, description: 'Other options considered' },
              topic: { type: 'string', description: 'Related focus topic' }
            },
            required: ['decision', 'reasoning']
          }
        },
        {
          name: 'log_implementation_finding',
          description: 'Record discoveries made during coding',
          inputSchema: {
            type: 'object',
            properties: {
              finding: { type: 'string', description: 'What you discovered' },
              code_context: { type: 'string', description: 'Relevant code or file context' },
              topic: { type: 'string', description: 'Related focus topic' }
            },
            required: ['finding']
          }
        },
        {
          name: 'bridge_conversation',
          description: 'Connect conversations between Desktop and Code',
          inputSchema: {
            type: 'object',
            properties: {
              from_tool: { type: 'string', enum: ['desktop', 'code'] },
              to_tool: { type: 'string', enum: ['desktop', 'code'] },
              summary: { type: 'string', description: 'Summary of conversation to bridge' },
              open_questions: { type: 'array', items: { type: 'string' }, description: 'Questions to carry forward' }
            },
            required: ['from_tool', 'to_tool', 'summary']
          }
        },
        {
          name: 'get_focus_history',
          description: 'Get history of previous focus topics',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Maximum number of focus entries to return', default: 10 }
            }
          }
        }
      ]
    }));

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'thinking-partner://current-focus',
          name: 'Current Focus',
          description: 'What you\'re currently working on',
          mimeType: 'application/json'
        },
        {
          uri: 'thinking-partner://conversation-bridge',
          name: 'Conversation Bridge',
          description: 'Context bridge between Desktop and Code',
          mimeType: 'application/json'
        },
        {
          uri: 'thinking-partner://recent-decisions',
          name: 'Recent Decisions',
          description: 'Recent architectural decisions',
          mimeType: 'application/json'
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        const result = await this.tools[name](args);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      
      switch (uri) {
        case 'thinking-partner://current-focus':
          return {
            contents: [{ 
              type: 'text', 
              text: JSON.stringify(await this.storage.getCurrentFocus(), null, 2) 
            }]
          };
        case 'thinking-partner://conversation-bridge':
          return {
            contents: [{ 
              type: 'text', 
              text: JSON.stringify(await this.storage.getConversationBridge(), null, 2) 
            }]
          };
        case 'thinking-partner://recent-decisions':
          return {
            contents: [{ 
              type: 'text', 
              text: JSON.stringify(await this.storage.getRecentDecisions(), null, 2) 
            }]
          };
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Thinking Partner MCP server running');
  }
}

// Start the server
const server = new ThinkingPartnerServer();
server.run().catch(console.error);
