export interface ExecResult {
  stdout: string;
  stderr: string;
}

export interface Executor {
  run(command: string): Promise<ExecResult>;
}
