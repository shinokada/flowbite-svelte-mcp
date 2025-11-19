import { McpServer } from "tmcp";
import { StdioTransport } from "@tmcp/transport-stdio";
import { ZodJsonSchemaAdapter } from "@tmcp/adapter-zod";
import { getComponentListTool } from "./tools/getComponentList.js";
import { getComponentDocTool } from "./tools/getComponentDoc.js";
import { searchDocsTool } from "./tools/searchDocs.js";
const adapter = new ZodJsonSchemaAdapter();
const server = new McpServer({
    name: "flowbite-svelte-mcp",
    version: "0.1.0",
    description: "MCP server exposing Flowbite-Svelte LLM docs",
}, {
    adapter,
    capabilities: {
        tools: { listChanged: false },
        prompts: { listChanged: true },
        resources: { listChanged: true },
    },
});
// Register tools
// If Typescript complains about the object shape, pass the definition and handler 
// explicitly. This ensures the generic types in server.tool inference work correctly.
server.tool(getComponentListTool.definition, getComponentListTool.handler);
server.tool(getComponentDocTool.definition, getComponentDocTool.handler);
server.tool(searchDocsTool.definition, searchDocsTool.handler);
// start stdio transport
const transport = new StdioTransport(server);
transport.listen();
