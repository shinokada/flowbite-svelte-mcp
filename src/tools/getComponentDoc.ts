import { z } from 'zod';
import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Schema = z.object({
  component: z.string().describe('The documentation path (use findComponent first to get this)'),
});

type ComponentDocArgs = z.infer<typeof Schema>;

// Path to local llms.txt
const LLMS_INDEX_PATH = path.resolve(__dirname, '../data/llm/llms.txt');
const LLM_BASE_PATH = path.resolve(__dirname, '../data/llm');

export const getComponentDocTool = {
  definition: {
    name: 'getComponentDoc',
    description: 'Get documentation for a specific component',
    schema: Schema,
  },
  handler: async ({ component }: ComponentDocArgs) => {
    try {
      // 1. Read the local index file
      const indexText = await fs.readFile(LLMS_INDEX_PATH, 'utf-8');
      const cleanComponent = component.toLowerCase().trim();

      // 2. Find the line in llms.txt that contains "/{component}.md"
      const matchLine = indexText
        .split('\n')
        .find((line) => line.toLowerCase().endsWith(`/${cleanComponent}.md`));

      if (!matchLine) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Component '${component}' not found in documentation index.`,
            },
          ],
          isError: true,
        };
      }

      // 3. Extract the path from the URL (format: "/docs: https://flowbite-svelte.com/llm/...")
      const docUrl = matchLine.split(': ')[1]?.trim();

      if (!docUrl) {
        return {
          content: [{ type: 'text' as const, text: 'Invalid index entry found' }],
          isError: true,
        };
      }

      // 4. Convert URL to local file path
      // Extract path after "/llm/" from URL
      const urlParts = docUrl.split('/llm/');
      if (urlParts.length < 2) {
        return {
          content: [{ type: 'text' as const, text: 'Invalid URL format in index' }],
          isError: true,
        };
      }

      const relativePath = urlParts[1]; // e.g., "components/accordion.md"
      const localFilePath = path.join(LLM_BASE_PATH, relativePath);

      // 5. Read the local documentation file
      const text = await fs.readFile(localFilePath, 'utf-8');

      return {
        content: [
          {
            type: 'text' as const,
            text: text,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error reading documentation: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};
