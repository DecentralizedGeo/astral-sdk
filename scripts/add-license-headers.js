#!/usr/bin/env node

// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const HEADER = `// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

`;

/**
 * Check if a file already has license headers
 */
function hasLicenseHeader(content) {
  return content.includes('SPDX-License-Identifier') || content.includes('Copyright © 2025 Sophia Systems Corporation');
}

/**
 * Add license header to a TypeScript file
 */
function addHeaderToFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (hasLicenseHeader(content)) {
      console.log(`✓ ${filePath} already has license header`);
      return false;
    }

    const newContent = HEADER + content;
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Added license header to ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Process all TypeScript files in the project
 */
async function addLicenseHeaders() {
  console.log('🔍 Finding TypeScript files...');
  
  const patterns = [
    'src/**/*.ts',
    'test/**/*.ts',
    'examples/**/*.ts'
  ];

  let totalFiles = 0;
  let modifiedFiles = 0;

  for (const pattern of patterns) {
    const files = await glob(pattern);
    console.log(`📁 Processing ${pattern}: ${files.length} files`);
    
    for (const file of files) {
      totalFiles++;
      if (addHeaderToFile(file)) {
        modifiedFiles++;
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  console.log(`   Files already licensed: ${totalFiles - modifiedFiles}`);
}

// Run the script
addLicenseHeaders().catch(console.error);