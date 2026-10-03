import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { analyze, initialState, mutate, type AppState } from './core';

const statePath = path.join(process.cwd(), 'data', 'state.json');
let queue = Promise.resolve();

async function load(): Promise<AppState> {
  try {
    const state = JSON.parse(await readFile(statePath, 'utf8')) as AppState;
    return { ...state, observations: state.observations ?? [], decisions: state.decisions ?? [] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return initialState();
  }
}

export async function snapshot() {
  const state = await load();
  return { state, analysis: analyze(state) };
}

export async function dispatch(action: Record<string, unknown>) {
  const job = queue.then(async () => {
    const previous = await load();
    const state = mutate(previous, action);
    await mkdir(path.dirname(statePath), { recursive: true });
    const temporaryPath = `${statePath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(state, null, 2), 'utf8');
    await rename(temporaryPath, statePath);
    return { state, analysis: analyze(state) };
  });
  queue = job.then(() => undefined, () => undefined);
  return job;
}
