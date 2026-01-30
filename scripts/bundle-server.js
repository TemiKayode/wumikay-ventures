/**
 * Bundle the server with all dependencies into a single file
 * This ensures no "cannot find module" errors in production
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const serverDir = path.join(__dirname, '..', 'server');
const outputDir = path.join(__dirname, '..', 'server-bundle');
const outputFile = path.join(outputDir, 'server.js');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('📦 Bundling server with all dependencies...');
console.log(`   Input: ${path.join(serverDir, 'index.js')}`);
console.log(`   Output: ${outputFile}`);

esbuild.build({
  entryPoints: [path.join(serverDir, 'index.js')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: outputFile,
  minify: false, // Keep readable for debugging
  sourcemap: false,
  external: [], // Bundle everything
  // Handle native modules that can't be bundled
  loader: {
    '.node': 'file'
  },
  // Banner to help with debugging
  banner: {
    js: `// WumiKay Ventures Server Bundle
// Generated: ${new Date().toISOString()}
// This file contains all server dependencies bundled together
`
  },
  // Log build info
  logLevel: 'info'
}).then(result => {
  const stats = fs.statSync(outputFile);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`✅ Server bundled successfully!`);
  console.log(`   Size: ${sizeMB} MB`);
  
  // Copy .env file to bundle directory
  const envSource = path.join(serverDir, '.env');
  const envDest = path.join(outputDir, '.env');
  if (fs.existsSync(envSource)) {
    fs.copyFileSync(envSource, envDest);
    console.log(`   Copied .env file`);
  }
  
  console.log(`\n🎉 Bundle ready at: ${outputFile}`);
}).catch(err => {
  console.error('❌ Bundle failed:', err);
  process.exit(1);
});
