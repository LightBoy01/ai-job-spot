const fs = require('fs/promises');
const path = require('path');
const readline = require('readline');
const minimist = require('minimist');

// Maps provider names to the environment variable they correspond to.
const PROVIDER_VARS: Record<string, string> = {
  gemini: 'AI_API_KEY',
  openai: 'OPENAI_API_KEY', // For future use
  anthropic: 'ANTHROPIC_API_KEY', // For future use
  revalidate: 'REVALIDATE_SECRET_TOKEN', // Bonus: allow updating other keys too
};

const ENV_FILE_PATH = path.resolve(process.cwd(), '.env.local');

async function setApiKey() {
  const args = minimist(process.argv.slice(2));
  const provider = args.provider;

  if (!provider || typeof provider !== 'string') {
    console.error('Error: Please specify a provider with --provider=<provider_name>');
    console.error(`Available providers: ${Object.keys(PROVIDER_VARS).join(', ')}`);
    process.exit(1);
  }

  const variableName = PROVIDER_VARS[provider.toLowerCase()];

  if (!variableName) {
    console.error(`Error: Unknown provider '${provider}'.`);
    console.error(`Available providers: ${Object.keys(PROVIDER_VARS).join(', ')}`);
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Create a hidden input for the key
  const question = (query: string): Promise<string> =>
    new Promise((resolve) => {
      const onData = (char: Buffer) => {
        const key = char.toString();
        if (key === '\r' || key === '\n' || key === '\u0004') {
          // End of input
          process.stdin.setRawMode(false);
          process.stdin.removeListener('data', onData);
          rl.close();
          resolve('');
        } else if (key === '\u0003') {
          // Ctrl+C
          process.exit(1);
        } else {
          // Regular character
          process.stdout.write('*');
          resolve(key);
        }
      };

      rl.question(query, (answer) => {
          resolve(answer);
      });
    });

  const key = await question(`Please enter the new API key for ${provider} (${variableName}): `);
  console.log('\n'); // Newline after input

  if (!key.trim()) {
    console.error('Error: API key cannot be empty.');
    process.exit(1);
  }

  try {
    let envContent = '';
    try {
      envContent = await fs.readFile(ENV_FILE_PATH, 'utf-8');
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error;
      console.log('.env.local file not found, creating a new one.');
    }

    const lines = envContent.split('\n');
    let keyFound = false;
    const newLines = lines.map((line) => {
      if (line.startsWith(`${variableName}=`)) {
        keyFound = true;
        return `${variableName}=${key.trim()}`;
      }
      return line;
    });

    if (!keyFound) {
      newLines.push(`${variableName}=${key.trim()}`);
    }

    await fs.writeFile(ENV_FILE_PATH, newLines.filter(l => l).join('\n'), 'utf-8');
    console.log(`✅ Successfully updated ${variableName} in .env.local.`);

  } catch (error) {
    console.error('Failed to write to .env.local file:', error);
    process.exit(1);
  }
}

setApiKey();
