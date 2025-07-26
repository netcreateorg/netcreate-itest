#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const shortCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const commitDate = execSync('git log -1 --format=%cd --date=iso', { encoding: 'utf8' }).trim();
    const commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    const isDirty = execSync('git diff --quiet && git diff --cached --quiet || echo "dirty"', { encoding: 'utf8' }).trim() === 'dirty';
    
    return {
      branch,
      commit,
      shortCommit,
      commitDate,
      commitMessage,
      isDirty,
      buildTime: new Date().toISOString()
    };
  } catch (error) {
    console.warn('Could not get git info:', error.message);
    return {
      branch: 'unknown',
      commit: 'unknown',
      shortCommit: 'unknown',
      commitDate: 'unknown',
      commitMessage: 'unknown',
      isDirty: false,
      buildTime: new Date().toISOString()
    };
  }
}

// Generate the git info
const gitInfo = getGitInfo();

// Write to a file that can be imported
const outputPath = path.join(__dirname, '../app/system/git-info.js');
const content = `// Auto-generated git information
module.exports = ${JSON.stringify(gitInfo, null, 2)};
`;

fs.writeFileSync(outputPath, content);
console.log('Git info written to:', outputPath);