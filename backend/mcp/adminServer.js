const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const mongoose = require('mongoose');
const Post = require('../models/Post');

// We need our own mongo connection because this runs as a separate process
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      require('dotenv').config({ path: '../.env' });
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.error('MCP Server connected to MongoDB');
  } catch (error) {
    console.error('MCP MongoDB connection error:', error);
    process.exit(1);
  }
};

const server = new Server(
  {
    name: 'admin-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'update_feature_status',
        description: 'Updates the status of a Feature Request (Post)',
        inputSchema: {
          type: 'object',
          properties: {
            requestId: {
              type: 'string',
              description: 'The MongoDB ObjectId of the feature request',
            },
            newStatus: {
              type: 'string',
              enum: ['Under Review', 'Planned', 'In Progress', 'Completed', 'Rejected'],
              description: 'The new status to set',
            },
          },
          required: ['requestId', 'newStatus'],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'update_feature_status') {
    const { requestId, newStatus } = args;

    try {
      const post = await Post.findById(requestId);
      if (!post) {
        return {
          content: [{ type: 'text', text: `Feature request ${requestId} not found.` }],
          isError: true,
        };
      }

      post.status = newStatus;
      await post.save();

      return {
        content: [
          {
            type: 'text',
            text: `Successfully updated feature request ${requestId} to status: ${newStatus}. Title: "${post.title}"`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error updating feature request: ${error.message}` }],
        isError: true,
      };
    }
  }

  throw new Error(`Tool not found: ${name}`);
});

async function run() {
  await connectDB();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server running on stdio');
}

run().catch(console.error);
