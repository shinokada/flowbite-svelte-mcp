import { z } from 'zod';
import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const Schema = z.object({});
// Path to local llms.txt
const LLMS_INDEX_PATH = path.resolve(__dirname, '../data/llm/llms.txt');
export const getComponentListTool = {
    definition: {
        name: 'getComponentList',
        description: 'List all available Flowbite-Svelte documentation pages',
        schema: Schema,
    },
    handler: async () => {
        try {
            // Read local llms.txt file
            const text = await fs.readFile(LLMS_INDEX_PATH, 'utf-8');
            // Parse lines that look like: /docs: https://...
            const docs = text
                .split('\n')
                .filter((line) => line.startsWith('/docs') || line.startsWith('/icons'))
                .map((line) => {
                const [, fullUrl] = line.split(': ');
                if (!fullUrl)
                    return null;
                const parts = fullUrl.trim().split('/');
                const filename = parts.pop() || ''; // checkbox.md
                const category = parts.pop() || 'misc'; // forms
                const name = filename.replace('.md', '');
                return { name, category, url: fullUrl.trim() };
            })
                .filter((item) => item !== null);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(docs),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error reading component list: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    },
                ],
                isError: true,
            };
        }
    },
};
