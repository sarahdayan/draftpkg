import { beforeEach, describe, expect, it } from 'vitest';

import type { ExecResult, Executor } from '../executor';
import { setup } from '../setup';

describe('setup', () => {
  let executor: ReturnType<typeof createFakeExecutor>;

  beforeEach(() => {
    executor = createFakeExecutor({
      'wrangler whoami': 'You are logged in as test@example.com',
      'wrangler kv namespace create METADATA': 'id = "kv-namespace-id-123"',
      'wrangler r2 bucket create draftpkg-tarballs':
        'Created bucket draftpkg-tarballs',
      'wrangler deploy': 'Deployed to https://draftpkg-worker.test.workers.dev',
      'wrangler secret put API_KEY': 'Success',
    });
  });

  it('checks wrangler login', async () => {
    await setup(executor);

    expect(executor.calls[0]!.command).toBe('wrangler whoami');
  });

  it('creates a KV namespace', async () => {
    await setup(executor);

    expect(
      executor.calls.some((c) =>
        c.command.includes('kv namespace create METADATA'),
      ),
    ).toBe(true);
  });

  it('creates an R2 bucket', async () => {
    await setup(executor);

    expect(
      executor.calls.some((c) =>
        c.command.includes('r2 bucket create draftpkg-tarballs'),
      ),
    ).toBe(true);
  });

  it('deploys the worker', async () => {
    await setup(executor);

    expect(
      executor.calls.some((c) => c.command.includes('wrangler deploy')),
    ).toBe(true);
  });

  it('sets the API key as a secret', async () => {
    await setup(executor);

    expect(
      executor.calls.some((c) => c.command.includes('wrangler secret put API_KEY')),
    ).toBe(true);
  });

  it('returns the worker URL and API key', async () => {
    const result = await setup(executor);

    expect(result.workerUrl).toMatch(/^https:\/\//);
    expect(result.apiKey).toBeTruthy();
  });

  it('throws if not logged in', async () => {
    executor = createFakeExecutor({});
    executor.run = async (command) => {
      executor.calls.push({ command });
      if (command === 'wrangler whoami') {
        throw new Error('Not logged in');
      }

      return { stdout: '', stderr: '' };
    };

    await expect(setup(executor)).rejects.toThrow('logged in');
  });

  it('runs steps in the correct order', async () => {
    await setup(executor);

    const commands = executor.calls.map((c) => c.command);
    const whoamiIdx = commands.findIndex((c) => c.includes('whoami'));
    const kvIdx = commands.findIndex((c) => c.includes('kv namespace create'));
    const r2Idx = commands.findIndex((c) => c.includes('r2 bucket create'));
    const deployIdx = commands.findIndex((c) => c.includes('wrangler deploy'));

    expect(whoamiIdx).toBeLessThan(kvIdx);
    expect(kvIdx).toBeLessThan(r2Idx);
    expect(r2Idx).toBeLessThan(deployIdx);
  });
});

interface RecordedCall {
  command: string;
}

function createFakeExecutor(
  responses: Record<string, string> = {},
): Executor & { calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];

  return {
    calls,
    async run(command: string): Promise<ExecResult> {
      calls.push({ command });

      return { stdout: responses[command] ?? '', stderr: '' };
    },
  };
}
