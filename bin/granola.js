#!/usr/bin/env node

// Check if compiled version exists, otherwise use ts-node
const fs = require('fs');
const path = require('path');

const compiledIndex = path.join(__dirname, 'index.js');

if (fs.existsSync(compiledIndex)) {
  // Use compiled version
  require('./index.js');
} else {
  // Fall back to ts-node for development
  try {
    require('ts-node').register();
    require('../src/index.ts');
  } catch (error) {
    console.error('Error: Neither compiled JavaScript nor ts-node is available.');
    console.error('Please run "npm run build" or install ts-node.');
    process.exit(1);
  }
}
