import { z } from 'zod';
import fetch from 'node-fetch';
const Schema = z.object({
    component: z.string().describe("The documentation path (use findComponent first to get this)")
});
export const getComponentDocTool = {
    definition: {
        name: 'getComponentDoc',
        description: 'Get documentation for a specific component',
        schema: Schema,
    },
    handler: async ({ component }) => {
        // 1. Fetch the index first to find the correct path
        const indexUrl = 'https://flowbite-svelte.com/llms.txt';
        const indexRes = await fetch(indexUrl);
        if (!indexRes.ok) {
            return {
                content: [{ type: 'text', text: 'Failed to load doc index' }],
                isError: true,
            };
        }
        const indexText = await indexRes.text();
        const cleanComponent = component.toLowerCase().trim();
        // 2. Find the line in llms.txt that contains "/{component}.md"
        // This handles 'forms/checkbox.md' vs 'components/accordion.md' automatically
        const matchLine = indexText
            .split('\n')
            .find((line) => line.toLowerCase().endsWith(`/${cleanComponent}.md`));
        if (!matchLine) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Component '${component}' not found in documentation index.`,
                    },
                ],
                isError: true,
            };
        }
        // 3. Extract the full URL from the line (format: "/docs: https://...")
        const docUrl = matchLine.split(': ')[1]?.trim();
        if (!docUrl) {
            return {
                content: [{ type: 'text', text: 'Invalid index entry found' }],
                isError: true,
            };
        }
        // 4. Fetch the actual documentation
        const docRes = await fetch(docUrl);
        if (!docRes.ok) {
            return {
                content: [{ type: 'text', text: `Failed to fetch content from ${docUrl}` }],
                isError: true,
            };
        }
        const text = await docRes.text();
        return {
            content: [
                {
                    type: 'text',
                    text: text,
                },
            ],
        };
    },
};
