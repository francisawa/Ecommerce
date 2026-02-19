import SftpClient from 'ssh2-sftp-client';
import * as ftp from 'basic-ftp';
import { readdir, access } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';

const host = process.env.SG_HOST;
const port = Number(process.env.SG_PORT || '22');
const username = process.env.SG_USER;
const password = process.env.SG_PASS;
const protocol = (process.env.SG_PROTOCOL || (port === 21 ? 'ftp' : 'sftp')).toLowerCase();
const ftpSecure = (process.env.SG_FTP_SECURE || '').toLowerCase();

// Modes:
// - static:   upload deploy/siteground/static/public_html to the web root (public_html/www)
// - fullstack: upload deploy/siteground/fullstack to a non-web directory (default: ./nodeapp)
// - all:      do both
const mode = (process.env.SG_MODE || 'static').toLowerCase();

// Back-compat: SG_LOCAL_DIR and SG_REMOTE_DIR still work for static-only uploads.
const staticLocalRoot = process.env.SG_STATIC_LOCAL_DIR || process.env.SG_LOCAL_DIR || path.resolve('deploy/siteground/static/public_html');
const fullstackLocalRoot = process.env.SG_FULLSTACK_LOCAL_DIR || path.resolve('deploy/siteground/fullstack');

const staticRemoteOverride = process.env.SG_STATIC_REMOTE_DIR || process.env.SG_REMOTE_DIR;
const fullstackRemoteDir = process.env.SG_FULLSTACK_REMOTE_DIR || 'nodeapp';

// Optional: upload only specific relative files instead of the whole folder.
// Example: SG_STATIC_FILES="index.html,robots.txt"
const staticFiles = parseFileList(process.env.SG_STATIC_FILES);

const sftp = new SftpClient();
const ftpClient = new ftp.Client();
ftpClient.ftp.verbose = false;

const ignoreNames = new Set([
  '.DS_Store',
  'Thumbs.db',
  '.env',
]);

async function ensureLocalDirExists(localDir, label) {
  try {
    await access(localDir, constants.F_OK);
  } catch {
    throw new Error(`Local folder not found for ${label}: ${localDir}`);
  }
}

function parseFileList(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const parts = trimmed
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts : null;
}

function normalizeFtpRemotePath(remotePath) {
  if (!remotePath) return remotePath;
  const normalized = String(remotePath).replace(/\\/g, '/').trim();
  return normalized.replace(/^\/+/, '');
}

function resolveFtpRemotePath(baseDir, maybeRelative) {
  const cleaned = normalizeFtpRemotePath(maybeRelative);
  if (!cleaned) return baseDir;
  if (baseDir === '.' || cleaned === '.') return cleaned;
  return `${baseDir}/${cleaned}`;
}

function toPosixPath(localRelativePath) {
  return String(localRelativePath).replace(/\\/g, '/');
}

async function uploadFiles(localRoot, remoteRoot, relativePaths) {
  for (const relativePath of relativePaths) {
    if (ignoreNames.has(relativePath)) continue;

    const cleanRelative = relativePath.replace(/^\/+/, '');
    const localPath = path.resolve(localRoot, cleanRelative);
    const remotePath = `${remoteRoot}/${toPosixPath(cleanRelative)}`;
    const remoteDir = path.posix.dirname(remotePath);

    if (protocol === 'ftp') {
      const ftpRemoteRoot = normalizeFtpRemotePath(remoteRoot);
      const ftpRemotePath = `${ftpRemoteRoot}/${toPosixPath(cleanRelative)}`;
      const ftpRemoteDir = path.posix.dirname(ftpRemotePath);
      await ftpClient.ensureDir(ftpRemoteDir);
      await ftpClient.uploadFrom(localPath, ftpRemotePath);
      console.log(`Uploaded: ${ftpRemotePath}`);
    } else {
      await sftp.mkdir(remoteDir, true).catch(() => {});
      await sftp.fastPut(localPath, remotePath);
      console.log(`Uploaded: ${remotePath}`);
    }
  }
}

async function uploadDir(localDir, remoteDir) {
  if (protocol === 'ftp') {
    const ftpRemoteDir = normalizeFtpRemotePath(remoteDir);
    await ftpClient.ensureDir(ftpRemoteDir);
  } else {
    await sftp.mkdir(remoteDir, true).catch(() => {});
  }
  const entries = await readdir(localDir, { withFileTypes: true });

  for (const entry of entries) {
    if (ignoreNames.has(entry.name)) continue;

    const localPath = path.join(localDir, entry.name);
    const remotePath = `${remoteDir}/${entry.name}`;

    if (entry.isDirectory()) {
      await uploadDir(localPath, remotePath);
    } else if (entry.isFile()) {
      if (protocol === 'ftp') {
        const ftpRemotePath = normalizeFtpRemotePath(remotePath);
        const ftpRemoteParent = path.posix.dirname(ftpRemotePath);
        await ftpClient.ensureDir(ftpRemoteParent);
        await ftpClient.uploadFrom(localPath, ftpRemotePath);
        console.log(`Uploaded: ${ftpRemotePath}`);
      } else {
        await sftp.fastPut(localPath, remotePath);
        console.log(`Uploaded: ${remotePath}`);
      }
    }
  }
}

function pickWebRoot(items) {
  const names = new Set(items.map((i) => i.name));
  if (names.has('public_html')) return 'public_html';
  if (names.has('www')) return 'www';
  return '.';
}

function normalizeRemotePath(remotePath) {
  if (!remotePath) return remotePath;
  return remotePath.replace(/\\/g, '/');
}

function resolveRemotePath(baseDir, maybeRelative) {
  const cleaned = normalizeRemotePath(maybeRelative);
  if (!cleaned) return baseDir;
  if (cleaned.startsWith('/')) return cleaned;
  if (baseDir === '.' || cleaned === '.') return cleaned;
  return `${baseDir}/${cleaned}`;
}

if (!host || !username || !password) {
  console.error('Missing SG_HOST, SG_USER, or SG_PASS environment variable.');
  console.error('Tip (PowerShell): set them without quotes unless needed for special chars.');
  console.error('  $env:SG_HOST="your.server"; $env:SG_USER="user"; $env:SG_PASS="password"');
  process.exit(1);
}

if (!['static', 'fullstack', 'all'].includes(mode)) {
  console.error(`Invalid SG_MODE: ${mode}. Use static|fullstack|all.`);
  process.exit(1);
}

try {
  let webRoot = '.';
  let staticRemoteRoot = '.';
  let fullstackRemoteRoot = '.';

  if (protocol === 'ftp') {
    const shouldTryTls = ftpSecure ? ftpSecure !== 'false' : port === 21;
    if (shouldTryTls) {
      try {
        await ftpClient.access({ host, port, user: username, password, secure: 'explicit' });
      } catch (tlsErr) {
        try {
          await ftpClient.access({ host, port, user: username, password, secure: false });
        } catch {
          throw tlsErr;
        }
      }
    } else {
      await ftpClient.access({ host, port, user: username, password, secure: false });
    }

    const accountRootItems = await ftpClient.list();
    webRoot = pickWebRoot(accountRootItems);
    staticRemoteRoot = resolveFtpRemotePath(webRoot, staticRemoteOverride);
    fullstackRemoteRoot = resolveFtpRemotePath('.', fullstackRemoteDir);

    console.log(`Remote web root detected: ${webRoot} (ftp mode)`);
  } else {
    await sftp.connect({ host, port, username, password });

    const accountRootItems = await sftp.list('.');
    webRoot = pickWebRoot(accountRootItems);
    staticRemoteRoot = resolveRemotePath(webRoot, staticRemoteOverride);
    fullstackRemoteRoot = resolveRemotePath('.', fullstackRemoteDir);
    console.log(`Remote web root detected: ${webRoot}`);
  }

  if (mode === 'static' || mode === 'all') {
    await ensureLocalDirExists(staticLocalRoot, 'static');
    console.log(`Uploading static from: ${staticLocalRoot}`);
    console.log(`Uploading static to:   ${staticRemoteRoot}`);

    if (staticFiles && staticFiles.length) {
      console.log(`Static file subset:   ${staticFiles.join(', ')}`);
      await uploadFiles(staticLocalRoot, staticRemoteRoot, staticFiles);
    } else {
      await uploadDir(staticLocalRoot, staticRemoteRoot);
    }

    if (protocol !== 'ftp') {
      const checks = ['index.html', 'robots.txt', 'sitemap.xml'];
      for (const file of checks) {
        const stat = await sftp.exists(`${staticRemoteRoot}/${file}`);
        console.log(`${file}: ${stat ? 'OK' : 'MISSING'}`);
      }
    }
  }

  if (mode === 'fullstack' || mode === 'all') {
    await ensureLocalDirExists(fullstackLocalRoot, 'fullstack');
    console.log(`Uploading fullstack from: ${fullstackLocalRoot}`);
    console.log(`Uploading fullstack to:   ${fullstackRemoteRoot}`);
    await uploadDir(fullstackLocalRoot, fullstackRemoteRoot);
    console.log('Fullstack uploaded (note: Node runtime required to run server.js).');
  }

  if (protocol === 'ftp') {
    ftpClient.close();
  } else {
    await sftp.end();
  }

  console.log('UPLOAD_DONE');
} catch (err) {
  console.error('UPLOAD_FAILED:', err?.message || String(err));
  try {
    ftpClient.close();
  } catch {}
  try {
    await sftp.end();
  } catch {}
  process.exit(1);
}
