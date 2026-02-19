import { cp, mkdir, rm, writeFile, access } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const distDir = path.join(projectRoot, 'dist');
const deployRoot = path.join(projectRoot, 'deploy', 'siteground');
const staticPublicHtmlDir = path.join(deployRoot, 'static', 'public_html');
const fullstackDir = path.join(deployRoot, 'fullstack');

const fullstackFiles = [
    'server.js',
    'webhooks.js',
    'package.json',
    'package-lock.json',
    '.env.example',
    'production-config.js',
    'README.md',
    'DEPLOYMENT_SECURITY_GUIDE.md',
];

const seoFiles = [
    'robots.txt',
    'sitemap.xml',
    'Default.html',
];

const staticExtraFiles = [
    'styles.css',
    'scripts.js',
    'api',
];

const staticHtaccess = `# Prefer static entrypoint
DirectoryIndex index.html index.php

# If SiteGround leaves a placeholder Default.html, force it to your real homepage
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^Default\.html$ /index.html [R=302,L,NC]
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options \"nosniff\"
  Header always set X-Frame-Options \"SAMEORIGIN\"
  Header always set Referrer-Policy \"strict-origin-when-cross-origin\"
</IfModule>

# Cache static assets aggressively
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css \"access plus 1 month\"
  ExpiresByType application/javascript \"access plus 1 month\"
  ExpiresByType image/jpeg \"access plus 1 year\"
  ExpiresByType image/png \"access plus 1 year\"
  ExpiresByType image/webp \"access plus 1 year\"
  ExpiresByType image/svg+xml \"access plus 1 year\"
  ExpiresByType font/woff2 \"access plus 1 year\"
</IfModule>

# Protect sensitive files
<FilesMatch \"^(\\.env|package-lock\\.json|package\\.json)$\">
  Require all denied
</FilesMatch>
`;

async function exists(targetPath) {
    try {
        await access(targetPath, constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

async function copyIfExists(relativePath, destinationDir) {
    const source = path.join(projectRoot, relativePath);
    if (await exists(source)) {
        await cp(source, path.join(destinationDir, relativePath), { recursive: true });
    }
}

async function main() {
    console.log('Building production files with Vite...');
    execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });

    if (!(await exists(distDir))) {
        throw new Error('Build output not found: dist/');
    }

    console.log('Preparing deploy/siteground package...');
    await rm(deployRoot, { recursive: true, force: true });
    await mkdir(staticPublicHtmlDir, { recursive: true });
    await mkdir(fullstackDir, { recursive: true });

    await cp(distDir, staticPublicHtmlDir, { recursive: true });
    await writeFile(path.join(staticPublicHtmlDir, '.htaccess'), staticHtaccess, 'utf-8');

    for (const file of seoFiles) {
        await copyIfExists(file, staticPublicHtmlDir);
    }

    for (const file of staticExtraFiles) {
        await copyIfExists(file, staticPublicHtmlDir);
    }

    await cp(distDir, path.join(fullstackDir, 'dist'), { recursive: true });

    for (const file of seoFiles) {
        await copyIfExists(file, path.join(fullstackDir, 'dist'));
    }

    for (const file of staticExtraFiles) {
        await copyIfExists(file, path.join(fullstackDir, 'dist'));
    }

    for (const file of fullstackFiles) {
        await copyIfExists(file, fullstackDir);
    }

    const deployReadme = `SiteGround deployment package generated successfully.

Folders:
1) static/public_html
   - Upload this entire folder content to SiteGround public_html for static-only deployment.
   - Note: secure checkout API routes (/api/*) need a separate backend host.

2) fullstack
   - Contains Node backend + dist for VPS/Cloud deployment where Node.js is supported.
   - Steps: upload, create .env from .env.example, run npm install, then npm start (or PM2).
`;

    await writeFile(path.join(deployRoot, 'README.txt'), deployReadme, 'utf-8');

    console.log('Done. Output:');
    console.log(`- ${path.relative(projectRoot, path.join(deployRoot, 'static', 'public_html'))}`);
    console.log(`- ${path.relative(projectRoot, fullstackDir)}`);
}

main().catch((error) => {
    console.error('Failed to prepare SiteGround package:', error.message);
    process.exit(1);
});
