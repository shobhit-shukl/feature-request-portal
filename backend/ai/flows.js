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
    inputSchema: z.object({
      requestId: z.string().describe('The MongoDB ObjectId of the feature request'),
      newStatus: z.enum(['Under Review', 'Planned', 'In Progress', 'Completed', 'Rejected']).describe('The new status to set'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const client = await getMcpClient();
    const result = await client.callTool({
      name: 'update_feature_status',
      arguments: input,
    });
    
    if (result.isError) {
      return `TOOL ERROR: ${result.content.map(c => c.text).join('\n')}. You must fix this error before proceeding.`;
    }
    
    return result.content.map(c => c.text).join('\n');
  }
);

const searchFeatureRequestsTool = ai.defineTool(
  {
    name: 'search_feature_requests',
    description: 'Searches for feature requests by keywords to find their IDs and current status. Use this to find the request ID before updating its status.',
    inputSchema: z.object({
      query: z.string().describe('Search query to find feature requests (e.g. part of the title or description)'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const client = await getMcpClient();
    const result = await client.callTool({
      name: 'search_feature_requests',
      arguments: input,
    });
    
    if (result.isError) {
      return `TOOL ERROR: ${result.content.map(c => c.text).join('\n')}.`;
    }
    
    return result.content.map(c => c.text).join('\n');
  }
);

// Thrown by Genkit when the model/tool loop can't conclude within maxTurns.
// We turn that into a normal chat reply instead of letting it 500 the request.
const isTurnLimitError = (error) =>
  error?.message?.includes('Exceeded maximum tool call iterations');

// The Gemini free tier allows only a handful of requests/minute per model,
// and each tool-calling turn is its own request, so this is easy to hit.
const isRateLimitError = (error) =>
  error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('429');

// Standard flow for normal users (no tools attached)
const userChatFlow = ai.defineFlow(
  {
    name: 'userChatFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    try {
      const { text } = await ai.generate({
        prompt: `You are a helpful assistant for a feature request portal. Answer user queries about features, statuses, and the roadmap. Use the search tool to find relevant feature requests if the user asks about specific features. User query: ${prompt}`,
        tools: [searchFeatureRequestsTool],
        maxTurns: 5,
        config: { maxOutputTokens: 1024 },
      });
      return text;
    } catch (error) {
      if (isTurnLimitError(error)) {
        return "I couldn't pin down a single matching feature request for that within my search budget. Could you give me a more specific title or keyword?";
      }
      if (isRateLimitError(error)) {
        return "I'm getting rate-limited by the AI provider right now. Please wait about a minute and try again.";
      }
      throw error;
    }
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
    try {
      const { text } = await ai.generate({
        prompt: `You are an intelligent and efficient Admin Assistant for a Customer Feedback portal.
Your primary task is to help administrators search for and update feature requests using the connected MCP tools.

CRITICAL RULES FOR TOOL EXECUTION (MUST FOLLOW TO AVOID LOOPS):
1. SEARCH FIRST: If a user asks to update a feature request by its name or description, you MUST use the \`search_feature_requests\` tool first to retrieve its exact MongoDB ObjectId.
2. ONE-TRY RULE: If \`search_feature_requests\` returns "No feature requests found", DO NOT call the tool again with a different spelling or query. Stop immediately and politely inform the user that no matching record was found.
3. AMBIGUOUS MATCHES: If \`search_feature_requests\` returns more than one result, do NOT call it again with a refined query. Instead, either pick the single result whose title is the closest exact match, or if none is clearly the best match, stop and ask the user to clarify which one they mean (list the titles and IDs).
4. EXACT UPDATES: Use the \`update_feature_status\` tool ONLY when you have the exact MongoDB ObjectId. Do NOT guess or make up IDs.
5. VALID STATUSES: Ensure you only use the allowed statuses: 'Under Review', 'Planned', 'In Progress', 'Completed', or 'Rejected'. If the user provides a status outside this list, map it to the closest valid one or ask for clarification.
6. STOP AND REPORT: Once a tool successfully completes its action (either finding a result or updating a status), DO NOT call any more tools. Immediately generate a concise, human-friendly response summarizing the action taken.
7. BUDGET: You have at most one search call and one update call before you must respond with plain text. Don't spend calls re-searching or re-verifying.

Admin request: ${prompt}`,
        tools: [updateFeatureStatusTool, searchFeatureRequestsTool],
        maxTurns: 6,
      });
      return text;
    } catch (error) {
      if (isTurnLimitError(error)) {
        return "I wasn't able to resolve that request to a single feature request within my allowed steps — it may be ambiguous or not found. Could you give me the exact title, or the request ID, and try again?";
      }
      if (isRateLimitError(error)) {
        return "I'm getting rate-limited by the AI provider right now. Please wait about a minute and try again.";
      }
      throw error;
    }
  }
);

module.exports = { userChatFlow, adminChatFlow };
