export interface ExecResult {
  stdout: string;
  stderr: string;
}

export interface Executor {
  run(command: string, options: { cwd: string }): Promise<ExecResult>;
}
