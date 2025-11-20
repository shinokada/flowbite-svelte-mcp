import fs from 'fs';
import path from 'path';

const libPath = '/Users/shinichiokada/Flowbite/flowbite-svelte-local-development/src/lib';
const outputPath = './src/data/components.json';

const registry: Record<string, any> = {};

// Recursive function to find all component directories
function findComponentDirectories(basePath: string, relativePath: string = ''): void {
  const entries = fs.readdirSync(basePath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const fullPath = path.join(basePath, entry.name);
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    const indexPath = path.join(fullPath, 'index.ts');

    // If this directory has an index.ts, it's a component directory
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf-8');

      // Extract exported components
      const components = Array.from(
        content.matchAll(/export \{ default as (\w+) \}/g),
        (match) => match[1],
      );

      // Determine category based on path
      let category = 'components';
      if (relPath.startsWith('forms/') || relPath === 'forms') {
        category = 'forms';
      } else if (relPath.startsWith('typography/') || relPath === 'typography') {
        category = 'typography';
      }

      // Use the relative path as the key
      registry[relPath] = {
        components,
        category,
        docUrl: relPath,
      };
    }

    // Recursively search subdirectories
    findComponentDirectories(fullPath, relPath);
  }
}

// Start the recursive search
findComponentDirectories(libPath);

// Ensure the data directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created directory: ${outputDir}`);
}

// Write the registry file (overwrites if exists)
fs.writeFileSync(outputPath, JSON.stringify(registry, null, 2));
console.log(`Component registry generated at: ${outputPath}`);
console.log(`Total component groups registered: ${Object.keys(registry).length}`);

// Print summary by category
const summary: Record<string, number> = {};
for (const [, value] of Object.entries(registry)) {
  summary[value.category] = (summary[value.category] || 0) + 1;
}
console.log('\nSummary by category:');
for (const [cat, count] of Object.entries(summary)) {
  console.log(`  ${cat}: ${count} component groups`);
}
