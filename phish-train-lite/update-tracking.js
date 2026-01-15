#!/usr/bin/env node

/**
 * Helper script to update TRACK-APPLICATION.md
 *
 * Usage:
 *   node update-tracking.js --version 1.3.1 --date 2025-11-21 --added "New feature X" --changed "Modified Y" --fixed "Bug Z"
 *
 * Or use interactively:
 *   node update-tracking.js
 */

const fs = require('fs');
const readline = require('readline');
const path = require('path');

const TRACKING_FILE = path.join(__dirname, 'TRACK-APPLICATION.md');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function incrementVersion(currentVersion, type = 'patch') {
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  switch(type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

function extractCurrentVersion(content) {
  const versionMatch = content.match(/\*\*Version:\*\* ([\d.]+)/);
  return versionMatch ? versionMatch[1] : '1.0.0';
}

function updateHeader(content, newVersion, newDate) {
  content = content.replace(
    /\*\*Last Updated:\*\* .+/,
    `**Last Updated:** ${newDate}`
  );
  content = content.replace(
    /\*\*Version:\*\* .+/,
    `**Version:** ${newVersion}`
  );
  return content;
}

function addToRecentChanges(content, newVersion, newDate, added, changed, fixed, files) {
  const changeEntry = `
### ${newDate} (v${newVersion})
${added.length > 0 ? `**Added:**\n${added.map(item => `- ${item}`).join('\n')}\n` : ''}
${changed.length > 0 ? `**Changed:**\n${changed.map(item => `- ${item}`).join('\n')}\n` : ''}
${fixed.length > 0 ? `**Fixed:**\n${fixed.map(item => `- ${item}`).join('\n')}\n` : ''}
${files.length > 0 ? `**Files Modified:**\n${files.map(item => `- \`${item}\``).join('\n')}\n` : ''}
`;

  // Insert after "## Recent Changes" header
  const recentChangesIndex = content.indexOf('## Recent Changes');
  if (recentChangesIndex !== -1) {
    const insertIndex = content.indexOf('\n\n', recentChangesIndex) + 2;
    content = content.slice(0, insertIndex) + changeEntry + content.slice(insertIndex);
  }

  return content;
}

function addToVersionHistory(content, newVersion, newDate, added, changed, fixed) {
  const versionEntry = `
### Version ${newVersion} (${newDate})
${added.length > 0 ? `**Added:**\n${added.map(item => `- ${item}`).join('\n')}\n` : ''}
${changed.length > 0 ? `**Changed:**\n${changed.map(item => `- ${item}`).join('\n')}\n` : ''}
${fixed.length > 0 ? `**Fixed:**\n${fixed.map(item => `- ${item}`).join('\n')}\n` : ''}
`;

  // Insert after "## Version History" header
  const versionHistoryIndex = content.indexOf('## Version History');
  if (versionHistoryIndex !== -1) {
    const insertIndex = content.indexOf('\n\n', versionHistoryIndex) + 2;
    content = content.slice(0, insertIndex) + versionEntry + content.slice(insertIndex);
  }

  return content;
}

async function interactiveUpdate() {
  console.log('\n📋 TRACK-APPLICATION.md Update Helper\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Read current file
  let content = fs.readFileSync(TRACKING_FILE, 'utf8');
  const currentVersion = extractCurrentVersion(content);

  console.log(`Current version: ${currentVersion}\n`);

  // Get update type
  const updateType = await question('Update type (major/minor/patch) [patch]: ');
  const newVersion = incrementVersion(currentVersion, updateType || 'patch');
  const newDate = getCurrentDate();

  console.log(`\nNew version will be: ${newVersion}`);
  console.log(`Date: ${newDate}\n`);

  // Get changes
  console.log('Enter changes (press ENTER on empty line to finish each section):\n');

  const added = [];
  const changed = [];
  const fixed = [];
  const files = [];

  // Added features
  console.log('ADDED features:');
  while (true) {
    const item = await question('  - ');
    if (!item) break;
    added.push(item);
  }

  // Changed features
  console.log('\nCHANGED features:');
  while (true) {
    const item = await question('  - ');
    if (!item) break;
    changed.push(item);
  }

  // Fixed bugs
  console.log('\nFIXED bugs:');
  while (true) {
    const item = await question('  - ');
    if (!item) break;
    fixed.push(item);
  }

  // Modified files
  console.log('\nMODIFIED files:');
  while (true) {
    const item = await question('  - ');
    if (!item) break;
    files.push(item);
  }

  // Update content
  content = updateHeader(content, newVersion, newDate);
  content = addToRecentChanges(content, newVersion, newDate, added, changed, fixed, files);
  content = addToVersionHistory(content, newVersion, newDate, added, changed, fixed);

  // Preview
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Preview of changes:\n');
  console.log(`Version: ${currentVersion} → ${newVersion}`);
  console.log(`Date: ${newDate}`);
  if (added.length > 0) console.log(`Added: ${added.length} items`);
  if (changed.length > 0) console.log(`Changed: ${changed.length} items`);
  if (fixed.length > 0) console.log(`Fixed: ${fixed.length} items`);
  if (files.length > 0) console.log(`Files: ${files.length} items`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Confirm
  const confirm = await question('Save changes? (yes/no) [yes]: ');
  if (confirm.toLowerCase() === 'no' || confirm.toLowerCase() === 'n') {
    console.log('\n❌ Update cancelled.\n');
    rl.close();
    return;
  }

  // Save
  fs.writeFileSync(TRACKING_FILE, content, 'utf8');
  console.log('\n✅ TRACK-APPLICATION.md updated successfully!\n');
  console.log(`New version: ${newVersion}`);
  console.log(`File: ${TRACKING_FILE}\n`);

  rl.close();
}

// Run interactive mode
interactiveUpdate().catch(err => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
});
