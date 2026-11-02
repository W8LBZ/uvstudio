'use strict';

// The uvstudio-plus plugin carries its version in three places. The skill's update
// check compares its own metadata.version with plugin.json on main, so they must agree.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

const marketplace = JSON.parse(read('.claude-plugin', 'marketplace.json'));
const plugin = JSON.parse(read('plugins', 'uvstudio-plus', '.claude-plugin', 'plugin.json'));
const skill = read('plugins', 'uvstudio-plus', 'skills', 'uvstudio', 'SKILL.md');

function skillVersion(text) {
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(frontmatter, 'SKILL.md has frontmatter');
  const version = frontmatter[1].match(/^metadata:\s*\r?\n(?:[ \t]+.*\r?\n)*?[ \t]+version:\s*["']?([^"'\s]+)/m);
  assert.ok(version, 'SKILL.md frontmatter has metadata.version');
  return version[1];
}

test('plugin version is semver', () => {
  assert.match(plugin.version, /^\d+\.\d+\.\d+$/);
});

test('marketplace entry matches plugin.json', () => {
  const entry = marketplace.plugins.find((p) => p.name === plugin.name);
  assert.ok(entry, `marketplace lists ${plugin.name}`);
  assert.equal(entry.source, './plugins/uvstudio-plus');
  assert.equal(entry.version, plugin.version);
});

test('SKILL.md metadata.version matches plugin.json', () => {
  assert.equal(skillVersion(skill), plugin.version);
});

test('SKILL.md update check points at this plugin.json on main', () => {
  assert.ok(
    skill.includes('https://raw.githubusercontent.com/w8lbz/uvstudio/main/plugins/uvstudio-plus/.claude-plugin/plugin.json')
  );
});
