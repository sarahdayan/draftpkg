import type { Executor } from "./executor";

export interface SetupResult {
  workerUrl: string;
  apiKey: string;
}

export async function setup(_executor: Executor): Promise<SetupResult> {
  throw new Error("Not implemented");
}
