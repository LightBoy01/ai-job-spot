#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { globSync } from 'glob';

const addProvenance = async () => {
  const jobFiles = globSync('src/job-descriptions/*.md');
  console.log(`Found ${jobFiles.length} job files to process.`);

  for (const file of jobFiles) {
    const filePath = path.join(process.cwd(), file);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const { data, content } = matter(fileContent);

    let updated = false;
    if (data.source === undefined) {
      data.source = 'Sourced by AI Job Spot';
      updated = true;
    }
    if (data.sourceUrl === undefined) {
      data.sourceUrl = null;
      updated = true;
    }
    if (data.verificationDate === undefined) {
      data.verificationDate = new Date().toISOString();
      updated = true;
    }

    if (updated) {
      const newFileContent = matter.stringify(content, data);
      await fs.writeFile(filePath, newFileContent);
      console.log(`Updated: ${file}`);
    } else {
      console.log(`Skipped (no update needed): ${file}`);
    }
  }

  console.log('Provenance update complete.');
};

addProvenance().catch(console.error);
