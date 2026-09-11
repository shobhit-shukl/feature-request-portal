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
      const path = require('path');
      require('dotenv').config({ path: path.join(__dirname, '../.env') });
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
      {
        name: 'search_feature_requests',
        description: 'Searches for feature requests by keywords to find their IDs and current status',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find feature requests (e.g. part of the title or description)',
            },
          },
          required: ['query'],
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

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return {
        content: [{ type: 'text', text: `Error: '${requestId}' is not a valid MongoDB ObjectId. You MUST use the search_feature_requests tool to find the correct 24-character hex ID before updating.` }],
        isError: true,
      };
    }

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
  } else if (name === 'search_feature_requests') {
    const { query } = args;

    try {
      // Simple text search using regex on title and description
      const posts = await Post.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      }).limit(10);

      if (posts.length === 0) {
        return {
          content: [{ type: 'text', text: `No feature requests found matching query: "${query}"` }],
        };
      }

      const results = posts.map(
        (p) => `ID: ${p._id} | Title: "${p.title}" | Status: ${p.status}`
      ).join('\n');

      return {
        content: [{ type: 'text', text: `Found ${posts.length} feature requests:\n${results}` }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error searching feature requests: ${error.message}` }],
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
