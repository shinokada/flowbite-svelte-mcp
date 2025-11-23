import { z } from 'zod';
import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Schema = z.object({
  query: z.string(),
});

type SearchArgs = z.infer<typeof Schema>;

// Path to local context-full.txt
const CONTEXT_FULL_PATH = path.resolve(__dirname, '../data/llm/context-full.txt');

export const searchDocsTool = {
  definition: {
    name: 'searchDocs',
    description: 'Search in the full Flowbite-Svelte context',
    schema: Schema,
  },
  handler: async ({ query }: SearchArgs) => {
    try {
      // Read local context file
      const text = await fs.readFile(CONTEXT_FULL_PATH, 'utf-8');

      const lines = text.split('\n');
      const matches = lines.filter((line) => line.toLowerCase().includes(query.toLowerCase()));

      // Limit number of results
      const top = matches.slice(0, 50);

      return {
        content: top.map((line) => ({
          type: 'text' as const,
          text: line,
        })),
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error searching docs: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};
