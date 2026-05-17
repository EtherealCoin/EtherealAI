const fs = require('fs');
const path = require('path');

function safeRelativePath(inputPath = '') {
  const cleaned = String(inputPath || '')
    .replace(/\\/g, '/')
    .trim();
  const normalized = path.posix.normalize(cleaned || '.');

  if (path.isAbsolute(cleaned) || normalized.startsWith('../') || normalized === '..') {
    throw new Error('Path must stay inside the approved workspace');
  }

  return normalized === '.' ? '' : normalized;
}

function resolveWorkspacePath(workspace, inputPath = '') {
  const workspaceRoot = path.resolve(workspace.path);
  const relativePath = safeRelativePath(inputPath);
  const targetPath = path.resolve(workspaceRoot, relativePath);
  const relativeToRoot = path.relative(workspaceRoot, targetPath);

  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    throw new Error('Resolved path is outside the approved workspace');
  }

  return {
    workspaceRoot,
    relativePath,
    targetPath
  };
}

function listWorkspaceEntries(workspace, requestedPath = '') {
  const { targetPath, relativePath } = resolveWorkspacePath(workspace, requestedPath);

  if (!fs.existsSync(targetPath)) {
    return {
      path: relativePath,
      entries: []
    };
  }

  const stats = fs.statSync(targetPath);

  if (!stats.isDirectory()) {
    throw new Error('Path is not a directory');
  }

  const entries = fs.readdirSync(targetPath, { withFileTypes: true })
    .filter(entry => !entry.name.startsWith('.'))
    .map(entry => {
      const fullPath = path.join(targetPath, entry.name);
      const entryStats = fs.statSync(fullPath);
      const entryRelativePath = path.relative(workspace.path, fullPath).replace(/\\/g, '/');

      return {
        name: entry.name,
        path: entryRelativePath,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: entryStats.size,
        updated_at: entryStats.mtime.toISOString()
      };
    })
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });

  return {
    path: relativePath,
    entries
  };
}

function readWorkspaceFile(workspace, requestedPath = '') {
  const { targetPath, relativePath } = resolveWorkspacePath(workspace, requestedPath);

  if (!fs.existsSync(targetPath)) {
    throw new Error('File does not exist');
  }

  const stats = fs.statSync(targetPath);

  if (!stats.isFile()) {
    throw new Error('Path is not a file');
  }

  if (stats.size > 1024 * 1024) {
    throw new Error('File is too large to read in this panel');
  }

  return {
    path: relativePath,
    size: stats.size,
    content: fs.readFileSync(targetPath, 'utf8')
  };
}

function collectWorkspaceContext(workspace, options = {}) {
  const maxFiles = options.maxFiles || 20;
  const maxBytesPerFile = options.maxBytesPerFile || 12000;
  const maxTotalBytes = options.maxTotalBytes || 60000;
  const ignoredDirs = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    '.parcel-cache'
  ]);
  const allowedExtensions = new Set([
    '.js',
    '.json',
    '.md',
    '.html',
    '.css',
    '.sol',
    '.ts',
    '.tsx',
    '.jsx',
    '.txt'
  ]);
  const files = [];

  function walk(directory) {
    if (files.length >= maxFiles) {
      return;
    }

    const entries = fs.readdirSync(directory, { withFileTypes: true })
      .filter(entry => !entry.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      if (files.length >= maxFiles) {
        return;
      }

      const fullPath = path.join(directory, entry.name);
      const relativePath = path.relative(workspace.path, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (!ignoredDirs.has(entry.name)) {
          walk(fullPath);
        }

        continue;
      }

      if (!entry.isFile() || !allowedExtensions.has(path.extname(entry.name).toLowerCase())) {
        continue;
      }

      const stats = fs.statSync(fullPath);

      if (stats.size > maxBytesPerFile) {
        files.push({
          path: relativePath,
          size: stats.size,
          content: `[Skipped: file is ${stats.size} bytes]`
        });
        continue;
      }

      files.push({
        path: relativePath,
        size: stats.size,
        content: fs.readFileSync(fullPath, 'utf8')
      });
    }
  }

  if (fs.existsSync(workspace.path)) {
    walk(workspace.path);
  }

  let usedBytes = 0;
  const includedFiles = [];

  for (const file of files) {
    const content = file.content.slice(0, Math.max(0, maxTotalBytes - usedBytes));

    if (!content && usedBytes >= maxTotalBytes) {
      break;
    }

    usedBytes += content.length;
    includedFiles.push({
      ...file,
      content
    });
  }

  return {
    fileCount: includedFiles.length,
    files: includedFiles,
    text: includedFiles.length
      ? includedFiles.map(file => [
        `--- ${file.path} (${file.size} bytes) ---`,
        file.content
      ].join('\n')).join('\n\n')
      : 'Workspace has no readable context files yet.'
  };
}

function createWorkspaceRuntime({ fs, dbGet, workspacesDir }) {
  function ensureWorkspacesDir() {
    fs.mkdirSync(workspacesDir, { recursive: true });
  }

  async function getWorkspace(id) {
    const workspace = await dbGet(
      'SELECT * FROM workspaces WHERE id = ?',
      [id]
    );

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    return workspace;
  }

  return {
    ensureWorkspacesDir,
    getWorkspace
  };
}

module.exports = {
  safeRelativePath,
  resolveWorkspacePath,
  listWorkspaceEntries,
  readWorkspaceFile,
  collectWorkspaceContext,
  createWorkspaceRuntime
};
