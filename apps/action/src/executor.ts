import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface ExecResult {
  stdout: string;
  stderr: string;
}

export interface Executor {
  run(command: string, options: { cwd: string }): Promise<ExecResult>;
}

export function createExecutor(): Executor {
  return {
    async run(command, options) {
      return execAsync(command, { cwd: options.cwd });
    },
  };
}
