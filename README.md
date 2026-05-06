# Flowbite-Svelte MCP Server

This is a **Model Context Protocol (MCP)** server for Flowbite-Svelte documentation.  
It exposes tools to find components, query component docs, list components, and do full-text search, via stdio transport.

## Features

- 🔍 **Find Components** - Search for components by name or category
- 📚 **Get Documentation** - Retrieve full component documentation
- 📋 **List All Components** - Get a complete list of available components
- 🔎 **Full-Text Search** - Search across all documentation

## Getting Started

### Installation

```bash
git clone git@github.com:shinokada/flowbite-svelte-mcp.git
cd flowbite-svelte-mcp
pnpm install
```

### Setup

```bash
# Build the project (TypeScript compilation + data copy)
pnpm run build
```

## Usage

This server uses stdio transport, so it's compatible with MCP clients that launch via stdin/stdout (e.g. Claude Desktop, ChatGPT Desktop, MCP Inspector).

### Claude Desktop

1. **Locate your configuration file:**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Edit the file.** If it doesn't exist, create it. Add your server configuration:

   ```json
   {
     "mcpServers": {
       "flowbite-svelte": {
         "command": "npx",
         "args": ["-y", "flowbite-svelte-mcp"]
       }
     }
   }
   ```

   Alternatively, if you have a local clone, you can reference the build directly:

   ```json
   {
     "mcpServers": {
       "flowbite-svelte": {
         "command": "node",
         "args": ["/ABSOLUTE/PATH/TO/flowbite-svelte-mcp/build/server.js"]
       }
     }
   }
   ```

3. **Restart Claude Desktop.**

4. **Test it! Ask Claude:**
   - "Search the flowbite-svelte docs for how to use an Accordion, then give me the component details."
   - "How do I use the flowbite-svelte checkbox component?"
   - "What components are available in flowbite-svelte?"

### Available Tools

| Tool Name          | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `findComponent`    | Find a Flowbite-Svelte component and its documentation path        |
| `getComponentList` | Returns a list of all available components with categories         |
| `getComponentDoc`  | Returns the full documentation (markdown) for a specific component |
| `searchDocs`       | Full-text search over all Flowbite-Svelte documentation            |

## Development

### Project Structure

```text
flowbite-svelte-mcp/
├── src/
│   ├── data/
│   │   ├── components.json      # Component registry
│   │   └── llm/                 # Documentation files (generated)
│   ├── tools/                   # MCP tool implementations
│   └── server.ts                # MCP server entry point
├── build/                       # Compiled output (generated)
├── scripts/
│   ├── copyLlmData.ts          # Copy docs from flowbite-svelte.com
│   ├── postbuild.ts            # Copy data to build directory
│   └── generateComponentRegistry.ts
└── package.json
```

### Scripts

```bash
# Copy LLM documentation from flowbite-svelte.com.
pnpm run copy:llm

# Generate component registry
pnpm run gen:registry

# Build the project (TypeScript compilation + data copy)
pnpm run build

# Start the server (for manual testing/debugging) (Executed by Claude, rarely by developer)
pnpm run start 

# Testing
pnpm test              # Run all tests
pnpm test:watch        # Run tests in watch mode
pnpm test:coverage     # Run tests with coverage report

# Linting and formatting
pnpm run lint
pnpm run lint:fix
pnpm run format
pnpm run format:check
```

## Technical Details

### Architecture

- **Framework:** Built with `tmcp` (TypeScript MCP SDK)
- **Transport:** Stdio transport for MCP client communication
- **Schema Validation:** Zod with JSON Schema adapter
- **Documentation Source:** Local files copied from flowbite-svelte.com

### Data Flow

```text
https://flowbite-svelte.com/llm/
          ↓ (copy:llm script)
src/data/llm/
          ↓ (build → postbuild)
build/data/llm/
          ↓ (runtime)
MCP Tools → Claude/Client
```

### Why Local Files?

We store documentation files locally (instead of fetching remotely) for:

- ⚡ **Performance** - No network latency
- 🔌 **Offline Support** - Works without internet
- 🎯 **Reliability** - No external service dependencies
- 📦 **Self-Contained** - Everything bundled together
- 🔒 **Security** - Reduces external attack surface and eliminates need for runtime network permissions/calls.

## Testing

The project includes a comprehensive test suite using Vitest:

```bash
# Run all tests
pnpm test

# Watch mode (auto-rerun on changes)
pnpm test:watch

# Coverage report
pnpm test:coverage
```

See [tests/README.md](./tests/README.md) for more details on the test suite.

## Troubleshooting

### Build fails with missing modules

**Solution:** Run `pnpm install` to ensure all dependencies are installed.

### Tools not working in Claude Desktop

**Solutions:**

1. Check that the path in `claude_desktop_config.json` is correct and absolute
2. Restart Claude Desktop after making configuration changes
3. Check Claude Desktop logs for errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](./LICENSE)

## Links

- [Flowbite-Svelte Documentation](https://flowbite-svelte.com/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [tmcp TypeScript SDK](https://github.com/tmcp/tmcp)

---

### Made with ❤️ for the Flowbite-Svelte community
