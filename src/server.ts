import { McpServer } from 'tmcp';
import { StdioTransport } from '@tmcp/transport-stdio';
import { ZodJsonSchemaAdapter } from '@tmcp/adapter-zod';

import { findComponentTool } from './tools/findComponent.js';
import { getComponentListTool } from './tools/getComponentList.js';
import { getComponentDocTool } from './tools/getComponentDoc.js';
import { searchDocsTool } from './tools/searchDocs.js';

// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

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

// debugging: list registered tools
// console.error('Registered tools:', {
//   getComponentList: getComponentListTool.definition.name,
//   getComponentDoc: getComponentDocTool.definition.name,
//   searchDocs: searchDocsTool.definition.name,
//   findComponent: findComponentTool.definition.name
// });

// const componentsDataPath = path.join(__dirname, './data/components.json');
// const componentsData = JSON.parse(fs.readFileSync(componentsDataPath, 'utf-8'));

// server.resource(
//   {
//     uri: 'flowbite-svelte://components/registry',
//     name: 'Component Registry',
//     description: 'Complete list of all Flowbite-Svelte components organized by directory',
//   },
//   async () => {
//     return {
//       contents: [
//         {
//           uri: 'flowbite-svelte://components/registry',
//           mimeType: 'application/json',
//           text: JSON.stringify(componentsData, null, 2),
//         },
//       ],
//     };
//   }
// );

// server.prompt(
//   {
//     name: "flowbiteComponentRegistry",
//     description: "Full registry of Flowbite-Svelte components",
//   },
//   () => ({
//     messages: [
//       {
//         role: "assistant",
//         content: {
//           type: "text",
//           text: JSON.stringify(componentsData, null, 2)
//         }
//       }
//     ]
//   })
// );

// start stdio transport
const transport = new StdioTransport(server);
transport.listen();
