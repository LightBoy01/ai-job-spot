import fs from 'fs';
import path from 'path';
import ts from 'typescript';

// --- CONFIGURATION ---
const SEED_FILE_PATH = path.resolve('seedFirestore.ts');
const ARTICLES_DIR = path.resolve('src/articles');
const JOBS_DIR = path.resolve('src/job-descriptions');

// --- AST TRAVERSAL FUNCTIONS (ROBUST METHOD) ---

function astNodeToObject(node) {
  if (!node) return undefined;

  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => astNodeToObject(element));
  }

  if (ts.isObjectLiteralExpression(node)) {
    const obj = {};
    node.properties.forEach((prop) => {
      if (ts.isPropertyAssignment(prop) && prop.name) {
        const key = prop.name.getText();
        obj[key] = astNodeToObject(prop.initializer);
      }
    });
    return obj;
  }

  if (
    ts.isCallExpression(node) &&
    node.expression.getText().includes('Timestamp.fromDate')
  ) {
    if (node.arguments.length > 0 && ts.isNewExpression(node.arguments[0])) {
      const newExp = node.arguments[0];
      if (
        newExp.arguments.length > 0 &&
        ts.isStringLiteral(newExp.arguments[0])
      ) {
        return newExp.arguments[0].text;
      }
    }
  }

  return node.getText();
}

function findAndParseArray(sourceFile, variableName) {
  let arrayObject;
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(sourceFile) === variableName
    ) {
      if (node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
        arrayObject = astNodeToObject(node.initializer);
      }
    }
    if (!arrayObject) {
      ts.forEachChild(node, visit);
    }
  }
  visit(sourceFile);
  return arrayObject;
}

// --- YAML FRONTMATTER FUNCTION ---

function createYamlFrontmatter(metadata, fieldsToExclude) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(metadata)) {
    if (fieldsToExclude.includes(key)) continue;

    if (value === null || value === undefined) {
      lines.push(`${key}: null`);
    } else if (Array.isArray(value)) {
      lines.push(`${key}:`);
      value.forEach((item) =>
        lines.push(`  - "${String(item).replaceAll('"', '\"')}"`)
      );
    } else {
      lines.push(`${key}: "${String(value).replaceAll('"', '\"')}"`);
    }
  }
  lines.push('---');
  return lines.join('\n') + '\n\n';
}

// --- MAIN LOGIC ---

function main() {
  console.log(
    `Reading and parsing ${path.basename(SEED_FILE_PATH)} with the TypeScript Compiler API...`
  );
  const sourceCode = fs.readFileSync(SEED_FILE_PATH, 'utf8');
  const sourceFile = ts.createSourceFile(
    SEED_FILE_PATH,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  const articlesData = findAndParseArray(sourceFile, 'articles');
  const jobsData = findAndParseArray(sourceFile, 'jobs');

  if (!articlesData || !jobsData) {
    throw new Error(
      `Failed to find 'articles' or 'jobs' array nodes in the AST.`
    );
  }

  console.log(
    `Successfully parsed ${articlesData.length} articles and ${jobsData.length} jobs.`
  );

  // --- Migrate Articles ---
  console.log('\nMigrating metadata for articles...');
  for (const article of articlesData) {
    const markdownFile = article.markdownFile;
    const filePath = path.join(ARTICLES_DIR, markdownFile);
    if (fs.existsSync(filePath)) {
      const mdContent = fs.readFileSync(filePath, 'utf8');
      if (!mdContent.trim().startsWith('---')) {
        const frontmatter = createYamlFrontmatter(article, ['contentBody']);
        fs.writeFileSync(filePath, frontmatter + mdContent, 'utf8');
        console.log(`Migrated: ${markdownFile}`);
      } else {
        console.log(`Skipped (frontmatter exists): ${markdownFile}`);
      }
    }
  }

  // --- Migrate Jobs ---
  console.log('\nMigrating metadata for jobs...');
  for (const job of jobsData) {
    const markdownFile = job.markdownFile;
    const filePath = path.join(JOBS_DIR, markdownFile);
    if (fs.existsSync(filePath)) {
      const mdContent = fs.readFileSync(filePath, 'utf8');
      if (!mdContent.trim().startsWith('---')) {
        const frontmatter = createYamlFrontmatter(job, [
          'description',
          'responsibilities',
          'qualifications',
          'preferredQualifications',
        ]);
        fs.writeFileSync(filePath, frontmatter + mdContent, 'utf8');
        console.log(`Migrated: ${markdownFile}`);
      } else {
        console.log(`Skipped (frontmatter exists): ${markdownFile}`);
      }
    }
  }

  console.log('\nMigration complete!');
}

main();
