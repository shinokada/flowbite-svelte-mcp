# LLM Data Migration

## Overview

The LLM documentation files are now stored locally in `src/data/llm/` instead of being fetched remotely. This provides better performance, reliability, and offline support.

## Migration Steps

### 1. Copy LLM Data

Run the migration script to copy files from `flowbite-svelte`:

```bash
npm run copy:llm
```

This copies:

- All files from `flowbite-svelte/static/llm/` → `src/data/llm/`
- `flowbite-svelte/static/llms.txt` → `src/data/llm/llms.txt`

### 2. Install Dependencies

Remove the old `node-fetch` dependency (no longer needed):

```bash
pnpm install
```

### 3. Build and Test

```bash
npm run build
npm start
```

## Changes Made

### Files Updated

1. **src/tools/getComponentDoc.ts** - Now reads from local files instead of fetching
2. **src/tools/getComponentList.ts** - Reads local `llms.txt` index
3. **src/tools/searchDocs.ts** - Reads local `context-full.txt`
4. **package.json** - Added `copy:llm` script, removed `node-fetch` dependency

### Files Added

1. **scripts/copyLlmData.ts** - Migration script to copy LLM files
2. **src/data/llm/** - Directory containing all LLM documentation

## Benefits

✅ **Faster access** - No network latency  
✅ **Offline support** - Works without internet  
✅ **Version control** - Documentation changes tracked with code  
✅ **Simpler deployment** - Self-contained package  
✅ **Better reliability** - No external service dependencies

## Updating Documentation

When the Flowbite-Svelte documentation is updated:

```bash
npm run copy:llm
npm run build
```

## File Structure

```
flowbite-svelte-mcp/
├── src/
│   ├── data/
│   │   └── llm/
│   │       ├── llms.txt           # Index file
│   │       ├── context-full.txt   # Full context for search
│   │       ├── components/        # Component docs
│   │       ├── forms/            # Form component docs
│   │       ├── examples/         # Example files
│   │       └── ...               # Other directories
│   └── tools/                    # Updated to use local files
├── scripts/
│   └── copyLlmData.ts           # Migration script
└── package.json
```
