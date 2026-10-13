// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — Real Windows Filesystem API Route (Backend Service)
// Native Node.js `fs/promises`, `os`, and `child_process` Real File Operations
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = Router();

function getUserDirs() {
  const home = os.homedir();
  return {
    home,
    desktop: path.join(home, 'Desktop'),
    downloads: path.join(home, 'Downloads'),
    documents: path.join(home, 'Documents'),
    pictures: path.join(home, 'Pictures'),
    videos: path.join(home, 'Videos'),
    music: path.join(home, 'Music'),
  };
}

/**
 * Format raw stat to FileItem contract
 */
async function formatFileItem(itemPath, name, dirent = null) {
  try {
    const stats = await fs.stat(itemPath);
    const isDir = dirent ? dirent.isDirectory() : stats.isDirectory();
    const ext = isDir ? '' : path.extname(name).replace('.', '').toLowerCase();

    return {
      name,
      path: itemPath,
      isDirectory: isDir,
      size: isDir ? 0 : stats.size,
      createdAt: stats.birthtime.toISOString(),
      modifiedAt: stats.mtime.toISOString(),
      extension: ext,
    };
  } catch (err) {
    return {
      name,
      path: itemPath,
      isDirectory: dirent ? dirent.isDirectory() : false,
      size: 0,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      extension: path.extname(name).replace('.', '').toLowerCase(),
    };
  }
}

// ── GET /api/files/user-dirs ──────────────────────────────────────────────────
router.get('/user-dirs', (_req, res) => {
  res.json({ success: true, dirs: getUserDirs() });
});

// ── GET /api/files/read ───────────────────────────────────────────────────────
router.get('/read', async (req, res) => {
  try {
    let targetPath = req.query.path;
    if (!targetPath || typeof targetPath !== 'string' || targetPath.trim() === '') {
      targetPath = os.homedir();
    }

    // Resolve path safety
    const resolvedPath = path.resolve(targetPath);
    if (!fsSync.existsSync(resolvedPath)) {
      return res.status(404).json({ success: false, error: `Directory not found: ${resolvedPath}` });
    }

    const dirents = await fs.readdir(resolvedPath, { withFileTypes: true });
    
    // Filter out system hidden files like $RECYCLE.BIN, System Volume Information
    const validDirents = dirents.filter(d => !d.name.startsWith('$') && d.name !== 'System Volume Information');

    const fileItems = await Promise.all(
      validDirents.map(dirent => {
        const itemPath = path.join(resolvedPath, dirent.name);
        return formatFileItem(itemPath, dirent.name, dirent);
      })
    );

    res.json({
      success: true,
      currentPath: resolvedPath,
      files: fileItems,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/files/metadata ───────────────────────────────────────────────────
router.get('/metadata', async (req, res) => {
  try {
    const targetPath = req.query.path;
    if (!targetPath) return res.status(400).json({ success: false, error: 'Path parameter required' });

    const resolved = path.resolve(targetPath);
    const item = await formatFileItem(resolved, path.basename(resolved));
    res.json({ success: true, metadata: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/files/create-folder ──────────────────────────────────────────────
router.post('/create-folder', async (req, res) => {
  try {
    const { path: targetPath, name } = req.body;
    if (!targetPath) return res.status(400).json({ success: false, error: 'Target path required' });

    const folderName = name || 'New Folder';
    const fullPath = path.join(targetPath, folderName);
    
    await fs.mkdir(fullPath, { recursive: true });
    const item = await formatFileItem(fullPath, folderName);

    res.json({ success: true, folder: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/files/delete ────────────────────────────────────────────────────
router.post('/delete', async (req, res) => {
  try {
    const { path: targetPath } = req.body;
    if (!targetPath) return res.status(400).json({ success: false, error: 'Target path required' });

    const resolved = path.resolve(targetPath);
    await fs.rm(resolved, { recursive: true, force: true });
    res.json({ success: true, deletedPath: resolved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/files/rename ────────────────────────────────────────────────────
router.post('/rename', async (req, res) => {
  try {
    const { oldPath, newPath } = req.body;
    if (!oldPath || !newPath) return res.status(400).json({ success: false, error: 'oldPath and newPath required' });

    const resolvedOld = path.resolve(oldPath);
    const resolvedNew = path.resolve(newPath);

    await fs.rename(resolvedOld, resolvedNew);
    const updated = await formatFileItem(resolvedNew, path.basename(resolvedNew));

    res.json({ success: true, file: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/files/copy ──────────────────────────────────────────────────────
router.post('/copy', async (req, res) => {
  try {
    const { source, destination } = req.body;
    if (!source || !destination) return res.status(400).json({ success: false, error: 'source and destination required' });

    const resolvedSource = path.resolve(source);
    const resolvedDest = path.resolve(destination);

    await fs.cp(resolvedSource, resolvedDest, { recursive: true });
    const copied = await formatFileItem(resolvedDest, path.basename(resolvedDest));

    res.json({ success: true, file: copied });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/files/move ──────────────────────────────────────────────────────
router.post('/move', async (req, res) => {
  try {
    const { source, destination } = req.body;
    if (!source || !destination) return res.status(400).json({ success: false, error: 'source and destination required' });

    const resolvedSource = path.resolve(source);
    const resolvedDest = path.resolve(destination);

    await fs.rename(resolvedSource, resolvedDest);
    const moved = await formatFileItem(resolvedDest, path.basename(resolvedDest));

    res.json({ success: true, file: moved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/files/search ─────────────────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const query = req.query.query || '';
    let targetPath = req.query.path || os.homedir();

    const resolvedPath = path.resolve(targetPath);
    if (!fsSync.existsSync(resolvedPath)) {
      return res.status(404).json({ success: false, error: 'Path not found' });
    }

    const dirents = await fs.readdir(resolvedPath, { withFileTypes: true });
    const q = query.toLowerCase();

    const matchingDirents = dirents.filter(d => d.name.toLowerCase().includes(q));
    const results = await Promise.all(
      matchingDirents.map(d => formatFileItem(path.join(resolvedPath, d.name), d.name, d))
    );

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/files/open ──────────────────────────────────────────────────────
router.post('/open', async (req, res) => {
  try {
    const { path: targetPath } = req.body;
    if (!targetPath) return res.status(400).json({ success: false, error: 'Target path required' });

    const resolved = path.resolve(targetPath);
    
    // Launch file in Windows default associated application
    if (process.platform === 'win32') {
      await execAsync(`start "" "${resolved}"`);
    } else if (process.platform === 'darwin') {
      await execAsync(`open "${resolved}"`);
    } else {
      await execAsync(`xdg-open "${resolved}"`);
    }

    res.json({ success: true, openedPath: resolved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
