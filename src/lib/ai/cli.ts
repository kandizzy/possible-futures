import { spawn } from 'child_process';

/**
 * Run a prompt through the Claude CLI (`claude -p`).
 * Uses your Claude Max/Pro subscription instead of API credits.
 * The CLI doesn't support a separate system prompt, so we prepend it.
 * Prompt is sent via stdin to avoid OS argument length limits.
 */
export async function claudeCli(systemPrompt: string, userPrompt: string): Promise<string> {
  const combinedPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['-p'], {
      env: { ...process.env, TERM: 'dumb' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('Claude CLI timed out after 2 minutes. The prompt may be too large for CLI mode.'));
    }, 120_000);

    child.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    child.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

    child.on('error', (err: NodeJS.ErrnoException) => {
      clearTimeout(timeout);
      if (err.code === 'ENOENT') {
        reject(new Error(
          'Claude CLI not found. Install it with: npm install -g @anthropic-ai/claude-code\n' +
          'Or switch to API mode in Settings.'
        ));
      } else {
        reject(err);
      }
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr || stdout.slice(0, 200)}`));
        return;
      }
      if (!stdout.trim()) {
        reject(new Error(`Claude CLI returned empty output.${stderr ? ' Error: ' + stderr : ''}`));
        return;
      }
      resolve(stdout.trim());
    });

    // Send prompt via stdin and close
    child.stdin.write(combinedPrompt);
    child.stdin.end();
  });
}
