import { z } from "zod";
import fetch from "node-fetch";
const Schema = z.object({
    query: z.string(),
});
export const searchDocsTool = {
    definition: {
        name: "searchDocs",
        description: "Search in the full Flowbite-Svelte context",
        schema: Schema,
    },
    // 2. Apply the type to the handler arguments
    handler: async ({ query }) => {
        const url = "https://flowbite-svelte.com/llm/context-full.txt";
        const res = await fetch(url);
        if (!res.ok) {
            // Better to return error object than throw, to keep server alive
            return {
                content: [{ type: "text", text: `Error: ${res.status}` }],
                isError: true
            };
        }
        const text = await res.text();
        const lines = text.split("\n");
        const matches = lines.filter((line) => line.toLowerCase().includes(query.toLowerCase()));
        // Limit number of results
        const top = matches.slice(0, 50);
        return {
            content: top.map((line) => ({
                type: "text", // <--- FIXED: Added 'as const'
                text: line
            })),
        };
    },
};
