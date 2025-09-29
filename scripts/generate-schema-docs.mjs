import fs from 'fs/promises';
import path from 'path';
import { jobSchema, articleSchema } from '../seedFirestore.ts';

// Function to analyze a Zod schema and generate a markdown table
function generateMarkdownForSchema(schemaName, schema) {
  let markdown = `## ${schemaName}\n\n`;
  markdown += '| Field | Type | Required |\n';
  markdown += '|---|---|---|
';

  const shape = schema.shape;
  for (const key in shape) {
    const field = shape[key];
    const fieldType = field._def.typeName;

    let typeString = '';
    let isRequired = true;

    // Handle optional and nullable types
    if (fieldType === 'ZodOptional' || fieldType === 'ZodNullable') {
      isRequired = false;
      typeString = field._def.innerType._def.typeName.replace('Zod', '');
    } else if (fieldType === 'ZodUnion') {
        // Handle unions (e.g., date or string)
        const unionTypes = field._def.options.map(opt => opt._def.typeName.replace('Zod', '')).join(' or ');
        typeString = unionTypes;
        // Check if null is an option in the union
        if (field._def.options.some(opt => opt._def.typeName === 'ZodNull')) {
            isRequired = false;
        }
    } else {
      typeString = fieldType.replace('Zod', '');
    }

    // Handle arrays
    if (typeString === 'Array') {
        const arrayType = field._def.type._def.typeName.replace('Zod', '');
        typeString = `Array<${arrayType}>`;
    }

    markdown += `| ${key} | ${typeString} | ${isRequired ? 'Yes' : 'No'} |\n`;
  }

  return markdown;
}

async function main() {
  console.log('Generating content schema documentation from Zod schemas...');

  let fullMarkdown = '# Content Schema Documentation\n\n';
  fullMarkdown += 'This document is auto-generated from the Zod schemas in `seedFirestore.ts`.
';
  fullMarkdown += 'It represents the single source of truth for the required frontmatter fields for jobs and articles.\n\n';

  fullMarkdown += generateMarkdownForSchema('Jobs Schema (`jobSchema`)', jobSchema);
  fullMarkdown += '\n';
  fullMarkdown += generateMarkdownForSchema('Articles Schema (`articleSchema`)', articleSchema);

  const outputPath = path.join(process.cwd(), 'docs', 'CONTENT_SCHEMA.md');
  await fs.writeFile(outputPath, fullMarkdown);

  console.log(`Successfully generated documentation at ${outputPath}`);
}

main().catch(console.error);
