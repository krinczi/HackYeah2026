import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { analyze, DEMO_BAY_POINTS, formatTime, initialState, mutate, type AppState, type Destination } from './core';

const statePath = path.join(process.cwd(), 'data', 'state.json');
let queue = Promise.resolve();

async function load(): Promise<AppState> {
  try {
    const state = JSON.parse(await readFile(statePath, 'utf8')) as AppState & { event?: { title: string; end: number; status: 'planned' | 'cancelled'; nearby?: boolean; updatedAt?: string | null } };
    const scenarioDate = state.scenarioDate ?? initialState().scenarioDate;
    const rawEvents = (Array.isArray(state.events) ? state.events : state.event?.status === 'planned' && state.event.nearby !== false
      ? [{ id: 'legacy-event', title: state.event.title, end: state.event.end, destination: 'stop', status: 'planned', source: 'demo', updatedAt: state.event.updatedAt }]
      : []) as Array<AppState['events'][number] & { destination?: Destination }>;
    const events = rawEvents.map(event => ({
      ...event,
      startAt: event.startAt ?? null,
      endAt: event.endAt ?? `${scenarioDate}T${formatTime(event.end)}`,
      placeLabel: event.placeLabel ?? 'Punkt demonstracyjny przy Świętokrzyskiej',
      location: event.location ?? DEMO_BAY_POINTS[event.destination === 'shops' ? 'A' : event.destination === 'food' ? 'B' : 'C'],
    }));
    const decisions = state.decisions ?? [];
    const bays = state.bays.map(bay => {
      const legacyPlan = bay.id === 'A' && bay.slots.length === 2
        && bay.slots[0].start === 600 && bay.slots[0].end === 660 && bay.slots[0].mode === 'delivery'
        && bay.slots[1].start === 660 && bay.slots[1].end === 1320 && bay.slots[1].mode === 'parking';
      const eveningDecision = decisions.some(decision => decision.bayId === 'A' && decision.start < 1320 && decision.end > 1080);
      return legacyPlan && !eveningDecision ? { ...bay, slots: [bay.slots[0], { start: 660, end: 1080, mode: 'parking' as const }, { start: 1080, end: 1320, mode: 'pickup' as const }] } : bay;
    });
    const migrated = !state.scenarioDate || rawEvents.some(event => !event.endAt) || bays.some((bay, index) => bay !== state.bays[index]);
    return { ...state, revision: state.revision + Number(migrated), scenarioDate, bays, events, observations: state.observations ?? [], decisions };
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
