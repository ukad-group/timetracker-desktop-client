#!/usr/bin/env node

const { execSync } = require('child_process');
const platform = process.platform;

let script;
if (platform === 'win32') {
  script = 'build-client:win32';
} else if (platform === 'darwin') {
  script = 'build-client:darwin';
} else if (platform === 'linux') {
  script = 'build-client:linux';
} else {
  console.error(`Unsupported platform: ${platform}`);
  process.exit(1);
}

try {
  execSync(`npm run ${script}`, { stdio: 'inherit' });
} catch (error) {
  process.exit(error.status || 1);
}

