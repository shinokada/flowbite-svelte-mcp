# Flowbite-Svelte MCP Server

This is a **Model Context Protocol (MCP)** server for Flowbite-Svelte documentation.  
It exposes tools to query component docs, list components, and do full-text search, via stdio transport.

## Getting started

```bash
pnpm install
pnpm run build
pnpm run start // you need to run the server
```
## Usage

- This server uses stdio transport, so it's compatible with MCP clients that launch via stdin/stdout (e.g. Claude Desktop, ChatGPT Desktop, MCP Inspector).
- Make sure to add the executable (or node build/server.js) to your client config.

### Claude Desktop

1. Locate your configuration file:

- macOS: ~/Library/Application Support/Claude/claude_desktop_config.json

- Windows: %APPDATA%\Claude\claude_desktop_config.json

2. Edit the file. If the file doesn't exist, create it. Add your server like this (using the absolute path found in your logs):

```bash
{
  "mcpServers": {
    "flowbite-svelte": {
      "command": "node",
      "args": [
        "/Users/your-user-name/path/to/flowbite-svelte-mcp/build/server.js"
      ]
    }
  }
}
```

3. Restart Claude Desktop.

4. Ask Claude: 
- Search the flowbite-svelte docs for how to use an Accordion, then give me the component details.
- How do I use the flowbite-svelte accordion component? 
- What components are available in flowbite-svelte?

### Tools

| Tool name          | Description                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `getComponentList` | Returns a list of component names + filename                         |
| `getComponentDoc`  | Returns the documentation (markdown / text) for a specific component |
| `searchDocs`       | Full-text search over the `context-full.txt` of Flowbite-Svelte      |


## Explanation & Notes

1. **Using tmcp**  
   - We import `McpServer` from `tmcp`. :contentReference[oaicite:1]{index=1}  
   - We use the `ZodJsonSchemaAdapter` for schema validation.  
   - The `StdioTransport` from `@tmcp/transport-stdio` is used. :contentReference[oaicite:2]{index=2}  

2. **Tools**  
   - `getComponentList` returns a hardcoded or dynamic list of components.  
   - `getComponentDoc` fetches the markdown / LLM-friendly doc for a component.  
   - `searchDocs` fetches `context-full.txt` and searches it.

3. **Fetch**  
   - We use `node-fetch` to do HTTP GETs. Alternatively, you can bundle documentation locally (e.g. in `/data/`) to avoid fetch.

4. **MCP Client Integration**  
   - Once built, you run the server (`node build/server.js`).  
   - In **Claude Desktop** or **ChatGPT Desktop**, configure it to run your server, passing the command and args (e.g. `node build/server.js`).  
   - Because it's stdio transport, the client will communicate over your process's stdin/stdout.


