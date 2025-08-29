#!/usr/bin/env node

/**
 * Update Version Script
 * 
 * This script helps update version numbers across the PWA when deploying.
 * Usage: node update-version.js [new-version]
 * 
 * Example: node update-version.js v1.0.5
 */

const fs = require('fs');
const path = require('path');

// Get new version from command line argument
const newVersion = process.argv[2];

if (!newVersion) {
    console.error('Usage: node update-version.js [new-version]');
    console.error('Example: node update-version.js v1.0.5');
    process.exit(1);
}

// Validate version format
if (!/^v\d+\.\d+\.\d+$/.test(newVersion)) {
    console.error('Version must be in format: vX.Y.Z (e.g., v1.0.5)');
    process.exit(1);
}

// Extract version without 'v' prefix for manifest
const manifestVersion = newVersion.substring(1);

console.log(`Updating version to ${newVersion}...`);

// Update service-worker.js
try {
    const swPath = path.join(__dirname, 'service-worker.js');
    let swContent = fs.readFileSync(swPath, 'utf8');
    
    // Update the CACHE_VERSION
    swContent = swContent.replace(
        /const CACHE_VERSION = ['"]v[\d.]+['"];/,
        `const CACHE_VERSION = '${newVersion}';`
    );
    
    fs.writeFileSync(swPath, swContent);
    console.log('✅ Updated service-worker.js');
} catch (error) {
    console.error('❌ Failed to update service-worker.js:', error.message);
}

// Update manifest.json
try {
    const manifestPath = path.join(__dirname, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    manifest.version = manifestVersion;
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Updated manifest.json');
} catch (error) {
    console.error('❌ Failed to update manifest.json:', error.message);
}

console.log('\n🎉 Version update complete!');
console.log(`\nNext steps:`);
console.log(`1. Test your changes locally`);
console.log(`2. Commit and push to GitHub`);
console.log(`3. GitHub Pages will automatically deploy the update`);
console.log(`4. Users will see the update notification when they visit the site`);
