import { z } from 'zod';
import componentsData from '../data/components.json' with { type: 'json' };
const Schema = z.object({
    query: z
        .string()
        .describe("Component name or search term (e.g., 'Button', 'CardPlaceholder', 'form checkbox')"),
});
export const findComponentTool = {
    definition: {
        name: 'findComponent',
        description: 'Find a Flowbite-Svelte component and its documentation path. Use this FIRST before getComponentDoc to locate the correct component.',
        schema: Schema,
    },
    handler: async ({ query }) => {
        const searchTerm = query.toLowerCase().trim();
        const results = [];
        for (const [key, value] of Object.entries(componentsData)) {
            // Check if the search term matches the directory name
            if (key.includes(searchTerm)) {
                results.push({ match: key, ...value, matchType: 'directory' });
            }
            // Check if the search term matches any component name
            const matchingComponents = value.components.filter((comp) => comp.toLowerCase().includes(searchTerm));
            if (matchingComponents.length > 0) {
                results.push({
                    match: key,
                    ...value,
                    matchType: 'component',
                    matchedComponents: matchingComponents,
                });
            }
        }
        if (results.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `No components found matching "${query}". Try searching with a different term.`,
                    },
                ],
                isError: true,
            };
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    },
};
