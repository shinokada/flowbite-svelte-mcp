import { z } from 'zod';
import fetch from 'node-fetch';
const Schema = z.object({});
export const getComponentListTool = {
    definition: {
        name: 'getComponentList',
        description: 'List all available Flowbite-Svelte documentation pages',
        schema: Schema,
    },
    handler: async () => {
        const url = 'https://flowbite-svelte.com/llms.txt';
        const res = await fetch(url);
        if (!res.ok) {
            return {
                content: [{ type: 'text', text: 'Error fetching llms.txt index' }],
            };
        }
        const text = await res.text();
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
    },
};
