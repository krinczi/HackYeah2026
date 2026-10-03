import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { analyze, DEMO_BAY_POINTS, initialState, mutate, type AppState, type Destination } from './core';

const statePath = path.join(process.cwd(), 'data', 'state.json');
let queue = Promise.resolve();

async function load(): Promise<AppState> {
  try {
    const state = JSON.parse(await readFile(statePath, 'utf8')) as AppState & { event?: { title: string; end: number; status: 'planned' | 'cancelled'; nearby?: boolean; updatedAt?: string | null } };
    const rawEvents = (Array.isArray(state.events) ? state.events : state.event?.status === 'planned' && state.event.nearby !== false
      ? [{ id: 'legacy-event', title: state.event.title, end: state.event.end, destination: 'stop', status: 'planned', source: 'demo', updatedAt: state.event.updatedAt }]
      : []) as Array<AppState['events'][number] & { destination?: Destination }>;
    const events = rawEvents.map(event => event.location ? event : {
      ...event,
      placeLabel: event.placeLabel ?? 'Punkt demonstracyjny przy Świętokrzyskiej',
      location: DEMO_BAY_POINTS[event.destination === 'shops' ? 'A' : event.destination === 'food' ? 'B' : 'C'],
    });
    return { ...state, events, observations: state.observations ?? [], decisions: state.decisions ?? [] };
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
