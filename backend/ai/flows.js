const { z } = require('zod');
const { ai } = require('./genkitSetup');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const path = require('path');

let mcpClient = null;

// Initialize MCP Client connecting to our adminServer
async function getMcpClient() {
  if (mcpClient) return mcpClient;

  const transport = new StdioClientTransport({
    command: 'node',
    args: [path.join(__dirname, '../mcp/adminServer.js')],
  });

  mcpClient = new Client(
    { name: 'genkit-mcp-client', version: '1.0.0' },
    { capabilities: {} }
  );

  await mcpClient.connect(transport);
  return mcpClient;
}

// Define the Genkit tool that proxies the request to the MCP Server
const updateFeatureStatusTool = ai.defineTool(
  {
    name: 'update_feature_status',
    description: 'Updates the status of a Feature Request (Post). Use this when an admin asks to change the status of a request.',
    schema: z.object({
      requestId: z.string().describe('The MongoDB ObjectId of the feature request'),
      newStatus: z.enum(['Under Review', 'Planned', 'In Progress', 'Completed', 'Rejected']).describe('The new status to set'),
    }),
  },
  async (input) => {
    const client = await getMcpClient();
    const result = await client.callTool({
      name: 'update_feature_status',
      arguments: input,
    });
    
    if (result.isError) {
      throw new Error(result.content.map(c => c.text).join('\n'));
    }
    
    return result.content.map(c => c.text).join('\n');
  }
);

// Standard flow for normal users (no tools attached)
const userChatFlow = ai.defineFlow(
  {
    name: 'userChatFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    const { text } = await ai.generate({
      prompt: `You are a helpful assistant for a feature request portal. Answer the user's query: ${prompt}`,
    });
    return text;
  }
);

// Admin flow with MCP tools attached
const adminChatFlow = ai.defineFlow(
  {
    name: 'adminChatFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    const { text } = await ai.generate({
      prompt: `You are an admin assistant for a feature request portal. You have access to tools to update feature requests. Execute the user's request: ${prompt}`,
      tools: [updateFeatureStatusTool],
    });
    return text;
  }
);

module.exports = { userChatFlow, adminChatFlow };
