import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getGitHash() {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return Date.now().toString(36);
  }
}

function getDatasetInfo() {
  let datasetVersion = 2;
  let wordsCount = 6175;
  const wordsPath = resolve(__dirname, 'public/data/words.json');
  if (existsSync(wordsPath)) {
    try {
      const data = JSON.parse(readFileSync(wordsPath, 'utf-8'));
      datasetVersion = data.version || 2;
      wordsCount = data.count || (data.words ? data.words.length : 6175);
    } catch (e) {
      console.warn('[Version] Warning reading words.json:', e);
    }
  }
  return { datasetVersion, wordsCount };
}

function main() {
  const gitHash = getGitHash();
  const { datasetVersion, wordsCount } = getDatasetInfo();
  const builtAt = Date.now();
  const payload = {
    appVersion: "1.2.0",
    buildHash: gitHash,
    builtAt,
    datasetVersion,
    wordsCount
  };

  // 1. Write public/app-version.json (for remote update polling)
  const jsonOutputPath = resolve(__dirname, 'public/app-version.json');
  writeFileSync(jsonOutputPath, JSON.stringify(payload, null, 2), 'utf-8');

  // 2. Write src/app/version.ts (baked into the compiled bundle)
  const tsContent = `// Auto-generated file by generate-version.js. Do not edit manually.
export interface AppVersionInfo {
  appVersion: string;
  buildHash: string;
  builtAt: number;
  datasetVersion: number;
  wordsCount: number;
}

export const CURRENT_BUILD_INFO: AppVersionInfo = ${JSON.stringify(payload, null, 2)};
`;
  const tsOutputPath = resolve(__dirname, 'src/app/version.ts');
  writeFileSync(tsOutputPath, tsContent, 'utf-8');

  console.log(`[Version] Generated app-version.json & src/app/version.ts (buildHash: ${gitHash}, datasetVersion: ${datasetVersion}, words: ${wordsCount})`);
}

main();
