import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const activeProcesses = new Map();

export async function registerTerminalRoutes(fastify) {
  // Check if Git Bash exists on system
  fastify.get('/api/terminal/check-gitbash', async (_req, reply) => {
    const paths = [
      'C:\\Program Files\\Git\\bin\\bash.exe',
      'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
      'C:\\Git\\bin\\bash.exe',
    ];
    const available = paths.some((p) => fs.existsSync(p));
    return reply.send({ available });
  });

  // Spawn web fallback process session
  fastify.post('/api/terminal/spawn', async (req, reply) => {
    const { shell = 'powershell', cwd = process.env.USERPROFILE || process.cwd() } = req.body || {};
    const id = `web-term-${Date.now()}`;

    let executable = 'powershell.exe';
    let args = ['-NoLogo'];

    if (shell === 'cmd') {
      executable = 'cmd.exe';
      args = [];
    } else if (shell === 'gitbash' || shell === 'git-bash') {
      const gbPath = [
        'C:\\Program Files\\Git\\bin\\bash.exe',
        'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
        'C:\\Git\\bin\\bash.exe',
      ].find((p) => fs.existsSync(p));

      if (gbPath) {
        executable = gbPath;
        args = ['--login', '-i'];
      } else {
        return reply.status(400).send({ error: 'Git Bash not found on host machine.' });
      }
    }

    try {
      const proc = spawn(executable, args, {
        cwd: fs.existsSync(cwd) ? cwd : process.env.USERPROFILE || process.cwd(),
        shell: false,
        env: { ...process.env },
      });

      activeProcesses.set(id, { proc, cwd });

      return reply.send({ sessionId: id, shell, cwd });
    } catch (e) {
      return reply.status(500).send({ error: `Failed to spawn process: ${e.message}` });
    }
  });

  // Write input to session
  fastify.post('/api/terminal/write', async (req, reply) => {
    const { sessionId, input } = req.body || {};
    const item = activeProcesses.get(sessionId);

    if (!item) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    const commandStr = input.endsWith('\n') || input.endsWith('\r') ? input : `${input}\n`;

    try {
      item.proc.stdin.write(commandStr);
      return reply.send({ success: true });
    } catch (e) {
      return reply.status(500).send({ error: e.message });
    }
  });

  // Execute single command and return output buffer
  fastify.post('/api/terminal/exec', async (req, reply) => {
    const { command, shell = 'powershell', cwd = process.env.USERPROFILE || process.cwd() } = req.body || {};
    if (!command) {
      return reply.status(400).send({ error: 'Command required' });
    }

    const workingDir = fs.existsSync(cwd) ? cwd : process.env.USERPROFILE || process.cwd();

    try {
      let shellExec = 'powershell.exe';
      let cmdArgs = ['-NoProfile', '-Command', command];

      if (shell === 'cmd') {
        shellExec = 'cmd.exe';
        cmdArgs = ['/C', command];
      } else if (shell === 'gitbash' || shell === 'git-bash') {
        shellExec = 'bash.exe';
        cmdArgs = ['-c', command];
      }

      const output = execSync(`${shellExec} ${cmdArgs.join(' ')}`, {
        cwd: workingDir,
        encoding: 'utf8',
        timeout: 15000,
      });

      return reply.send({ success: true, output });
    } catch (e) {
      return reply.send({
        success: false,
        output: e.stdout ? e.stdout.toString() : e.message,
        error: e.stderr ? e.stderr.toString() : e.message,
      });
    }
  });
}
