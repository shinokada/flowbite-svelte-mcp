import { McpServer } from 'tmcp';
import { StdioTransport } from '@tmcp/transport-stdio';
import { ZodJsonSchemaAdapter } from '@tmcp/adapter-zod';

import { findComponentTool } from './tools/findComponent.js';
import { getComponentListTool } from './tools/getComponentList.js';
import { getComponentDocTool } from './tools/getComponentDoc.js';
import { searchDocsTool } from './tools/searchDocs.js';

const adapter = new ZodJsonSchemaAdapter();

const server = new McpServer(
  {
    name: 'flowbite-svelte-mcp',
    version: '0.1.0',
    description: 'MCP server exposing Flowbite-Svelte LLM docs',
  },
  {
    adapter,
    capabilities: {
      tools: { listChanged: true },
      prompts: { listChanged: true },
      resources: { listChanged: true },
    },
  },
);

// Register tools
server.tool(findComponentTool.definition, findComponentTool.handler);
server.tool(getComponentListTool.definition, getComponentListTool.handler);
server.tool(getComponentDocTool.definition, getComponentDocTool.handler);
server.tool(searchDocsTool.definition, searchDocsTool.handler);

// start stdio transport
const transport = new StdioTransport(server);
transport.listen();
