export type Mode = 'delivery' | 'parking' | 'pickup';
export type Destination = 'shops' | 'food' | 'stop';
export type Vehicle = 'car' | 'van';
export type Slot = { start: number; end: number; mode: Mode };
export type Bay = {
  id: string;
  name: string;
  distance: Record<Destination, number>;
  van: boolean;
  closed: boolean;
  occupancy: 'unknown' | 'reported_occupied';
  occupancyAt: number | null;
  slots: Slot[];
};
export type StopRequest = {
  id: string;
  mode: Mode;
  destination: Destination;
  arrival: number;
  duration: number;
  vehicle: Vehicle;
  source: 'demo_seed' | 'user';
  createdAt: string;
};
export type CityEvent = {
  title: string;
  end: number;
  nearby: boolean;
  status: 'planned' | 'cancelled';
  source: 'demo';
  updatedAt?: string | null;
};
export type Observation = {
  id: string;
  bayId: string;
  kind: 'arrived' | 'departed' | 'occupied';
  source: 'user' | 'operator_demo';
  scenarioMinute: number;
  recordedAt: string;
};
export type PlanDecision = {
  id: string;
  bayId: string;
  mode: Mode;
  start: number;
  end: number;
  approvedAt: string;
  scenarioMinute: number;
};
export type AppState = {
  revision: number;
  now: number;
  bays: Bay[];
  requests: StopRequest[];
  observations: Observation[];
  decisions: PlanDecision[];
  event: CityEvent;
  lastDecision: string | null;
};
export type Match = { bay: Bay; distance: number; occupancy: Bay['occupancy'] };
export type Outcome = { requestId: string; mode: Mode; served: boolean; bayId?: string; distance?: number; forecast?: boolean };
export type Variant = {
  id: string;
  bayId: string | null;
  mode: Mode | null;
  start: number;
  end: number;
  score: number;
  outcomes: Outcome[];
  served: Record<Mode, number>;
  unmet: Record<Mode, number>;
  changes: number;
  reason: string;
};
export type Analysis = { start: number; end: number; variants: Variant[]; recommendedId: string; confidence: 'low'; explanation: string };

export const MODES: Mode[] = ['delivery', 'parking', 'pickup'];
export const MODE_LABEL: Record<Mode, string> = { delivery: 'Dostawa', parking: 'Parking', pickup: 'Odbiór' };
export const DEST_LABEL: Record<Destination, string> = { shops: 'Sklepy', food: 'Restauracje', stop: 'Przystanek' };
export const MAX_DURATION: Record<Mode, number> = { delivery: 30, parking: 120, pickup: 15 };
const WEIGHT: Record<Mode, number> = { delivery: 4, parking: 1, pickup: 3 };

export function formatTime(minute: number): string {
  const h = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function initialState(): AppState {
  const parking: Slot[] = [{ start: 600, end: 1320, mode: 'parking' }];
  return {
    revision: 1,
    now: 600,
    bays: [
      { id: 'A', name: 'Zatoka A', distance: { shops: 40, food: 120, stop: 150 }, van: true, closed: false, occupancy: 'unknown', occupancyAt: null, slots: [{ start: 600, end: 660, mode: 'delivery' }, { start: 660, end: 1320, mode: 'parking' }] },
      { id: 'B', name: 'Zatoka B', distance: { shops: 80, food: 50, stop: 110 }, van: true, closed: false, occupancy: 'unknown', occupancyAt: null, slots: structuredClone(parking) },
      { id: 'C', name: 'Zatoka C', distance: { shops: 140, food: 80, stop: 35 }, van: false, closed: false, occupancy: 'unknown', occupancyAt: null, slots: structuredClone(parking) },
    ],
    requests: [
      { id: 'seed-d1', mode: 'delivery', destination: 'shops', arrival: 720, duration: 15, vehicle: 'van', source: 'demo_seed', createdAt: 'scenariusz' },
      { id: 'seed-p1', mode: 'parking', destination: 'shops', arrival: 690, duration: 60, vehicle: 'car', source: 'demo_seed', createdAt: 'scenariusz' },
      { id: 'seed-p2', mode: 'parking', destination: 'food', arrival: 690, duration: 60, vehicle: 'car', source: 'demo_seed', createdAt: 'scenariusz' },
      { id: 'seed-p3', mode: 'parking', destination: 'stop', arrival: 690, duration: 60, vehicle: 'car', source: 'demo_seed', createdAt: 'scenariusz' },
    ],
    observations: [],
    decisions: [],
    event: { title: 'Wydarzenie przykładowe', end: 720, nearby: true, status: 'cancelled', source: 'demo', updatedAt: null },
    lastDecision: null,
  };
}

export function modeAt(bay: Bay, time: number): Mode | null {
  return bay.slots.find(slot => slot.start <= time && time < slot.end)?.mode ?? null;
}

export function validThroughout(bay: Bay, mode: Mode, start: number, duration: number): boolean {
  const end = start + duration;
  if (duration <= 0 || duration > MAX_DURATION[mode] || end > 1320 || bay.closed) return false;
  let cursor = start;
  for (const slot of bay.slots) {
    if (slot.end <= cursor) continue;
    if (slot.start > cursor || slot.mode !== mode) return false;
    cursor = Math.min(end, slot.end);
    if (cursor >= end) return true;
  }
  return false;
}

function recentOccupied(bay: Bay, now: number, arrival: number): boolean {
  return occupancyStatus(bay, now) === 'reported_occupied' && arrival <= now + 15;
}

export function occupancyStatus(bay: Bay, now: number): Bay['occupancy'] {
  return bay.occupancy === 'reported_occupied' && bay.occupancyAt !== null && now - bay.occupancyAt <= 15 ? 'reported_occupied' : 'unknown';
}

export function occupancyEvidence(state: AppState, bay: Bay): string {
  const observation = [...state.observations].reverse().find(item => item.bayId === bay.id);
  if (!observation) return 'Brak pomiaru zajętości';
  const age = state.now - observation.scenarioMinute;
  const when = `o ${formatTime(observation.scenarioMinute)}`;
  if (observation.kind === 'departed') return `${observation.source === 'user' ? 'Użytkownik zgłosił odjazd' : 'Operator demo usunął zgłoszenie zajęcia'} ${when}; wolne miejsce niepotwierdzone`;
  if (age > 15) return `Zgłoszenie zajęcia ${when} jest nieaktualne`;
  return `${observation.source === 'user' ? 'Użytkownik' : 'Operator demo'} zgłosił zajęcie ${when}`;
}

export function rankBays(state: AppState, input: Pick<StopRequest, 'mode' | 'destination' | 'arrival' | 'duration' | 'vehicle'>): Match[] {
  return state.bays
    .filter(bay => (input.vehicle !== 'van' || bay.van) && validThroughout(bay, input.mode, input.arrival, input.duration))
    .filter(bay => !recentOccupied(bay, state.now, input.arrival))
    .map(bay => ({ bay, distance: bay.distance[input.destination], occupancy: occupancyStatus(bay, state.now) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);
}

function overlay(slots: Slot[], start: number, end: number, mode: Mode): Slot[] {
  const parts: Slot[] = [];
  for (const slot of slots) {
    if (slot.end <= start || slot.start >= end) parts.push({ ...slot });
    else {
      if (slot.start < start) parts.push({ start: slot.start, end: start, mode: slot.mode });
      if (slot.end > end) parts.push({ start: end, end: slot.end, mode: slot.mode });
    }
  }
  parts.push({ start, end, mode });
  parts.sort((a, b) => a.start - b.start);
  const merged: Slot[] = [];
  for (const part of parts) {
    const last = merged.at(-1);
    if (last && last.end === part.start && last.mode === part.mode) last.end = part.end;
    else merged.push(part);
  }
  return merged;
}

export function eventForecast(state: AppState, start: number, end: number): StopRequest[] {
  const event = state.event;
  const arrival = event.end - 15;
  if (event.status !== 'planned' || !event.nearby || arrival < start || arrival >= end) return [];
  return [0, 1].map(n => ({ id: `forecast-${n}`, mode: 'pickup' as const, destination: 'stop' as const, arrival: arrival + n * 8, duration: 10, vehicle: 'car' as const, source: 'demo_seed' as const, createdAt: 'prognoza demonstracyjna' }));
}

function simulate(state: AppState, bays: Bay[], start: number, end: number): Outcome[] {
  const requests = [...state.requests.filter(r => r.arrival >= start && r.arrival < end), ...eventForecast(state, start, end)]
    .sort((a, b) => a.arrival - b.arrival || WEIGHT[b.mode] - WEIGHT[a.mode]);
  const occupiedUntil = new Map<string, number>();
  return requests.map(request => {
    const possible = bays
      .filter(bay => (request.vehicle !== 'van' || bay.van) && validThroughout(bay, request.mode, request.arrival, request.duration))
      .filter(bay => !recentOccupied(bay, state.now, request.arrival) && (occupiedUntil.get(bay.id) ?? 0) <= request.arrival)
      .sort((a, b) => a.distance[request.destination] - b.distance[request.destination]);
    const bay = possible[0];
    if (!bay) return { requestId: request.id, mode: request.mode, served: false, forecast: request.id.startsWith('forecast-') };
    occupiedUntil.set(bay.id, request.arrival + request.duration);
    return { requestId: request.id, mode: request.mode, served: true, bayId: bay.id, distance: bay.distance[request.destination], forecast: request.id.startsWith('forecast-') };
  });
}

function summarize(outcomes: Outcome[]): { served: Record<Mode, number>; unmet: Record<Mode, number> } {
  const served = { delivery: 0, parking: 0, pickup: 0 };
  const unmet = { delivery: 0, parking: 0, pickup: 0 };
  for (const outcome of outcomes) (outcome.served ? served : unmet)[outcome.mode]++;
  return { served, unmet };
}

function makeVariant(state: AppState, start: number, end: number, bayId: string | null, mode: Mode | null): Variant {
  const bays = state.bays.map(bay => bay.id === bayId && mode ? { ...bay, slots: overlay(bay.slots, start, end, mode) } : bay);
  const outcomes = simulate(state, bays, start, end);
  const { served, unmet } = summarize(outcomes);
  const changes = bayId ? 1 : 0;
  const distancePenalty = outcomes.filter(o => o.served).reduce((sum, o) => sum + (o.distance ?? 0) / 200, 0);
  const score = Math.round((unmet.delivery * 4 + unmet.parking + unmet.pickup * 3 + changes * 2 + distancePenalty) * 10) / 10;
  const reason = bayId && mode ? `${bayId}: ${MODE_LABEL[mode].toLowerCase()} ${formatTime(start)}–${formatTime(end)}` : 'Zachowaj obecny plan';
  return { id: bayId && mode ? `${bayId}-${mode}` : 'keep', bayId, mode, start, end, score, outcomes, served, unmet, changes, reason };
}

export function analyze(state: AppState): Analysis {
  const start = Math.max(660, Math.ceil((state.now + 30) / 60) * 60);
  const end = Math.min(1320, start + 120);
  const keep = makeVariant(state, start, end, null, null);
  const variants = [keep];
  for (const bay of state.bays) {
    if (bay.closed || recentOccupied(bay, state.now, start)) continue;
    for (const mode of MODES) {
      if (mode === 'delivery' && !bay.van) continue;
      if (modeAt(bay, start) === mode) continue;
      variants.push(makeVariant(state, start, end, bay.id, mode));
    }
  }
  variants.sort((a, b) => a.score - b.score || a.changes - b.changes);
  const best = variants[0];
  const realPickupSignals = state.requests.filter(r => r.mode === 'pickup' && r.arrival >= start && r.arrival < end).length;
  const eventOnly = best.mode === 'pickup' && realPickupSignals === 0;
  const eventWithoutPickupEvidence = state.event.status === 'planned' && state.event.nearby && realPickupSignals === 0 && eventForecast(state, start, end).length > 0;
  const improvement = keep.score - best.score;
  const recommendedId = best.id !== 'keep' && improvement >= 2 && !eventOnly ? best.id : 'keep';
  const explanation = recommendedId === 'keep'
    ? eventWithoutPickupEvidence ? 'Samo wydarzenie nie wystarcza do zmiany. Potrzebny jest sygnał odbioru lub potwierdzenie operatora.' : 'Przewaga zmiany jest zbyt mała lub dane są zbyt słabe. Zachowaj plan.'
    : `${best.reason}. Szacowany koszt niezaspokojonych potrzeb spada o ${improvement.toFixed(1)} pkt.`;
  return { start, end, variants, recommendedId, confidence: 'low', explanation };
}

export function applyVariant(state: AppState, id: string): AppState {
  const analysis = analyze(state);
  const variant = analysis.variants.find(v => v.id === id);
  if (!variant) throw new Error('Nieaktualny wariant. Odśwież panel.');
  if (variant.id === 'keep') return { ...state, revision: state.revision + 1, lastDecision: `Zachowano plan o ${formatTime(state.now)}` };
  const bays = state.bays.map(bay => bay.id === variant.bayId ? { ...bay, slots: overlay(bay.slots, variant.start, variant.end, variant.mode!) } : bay);
  const decision: PlanDecision = { id: crypto.randomUUID(), bayId: variant.bayId!, mode: variant.mode!, start: variant.start, end: variant.end, approvedAt: new Date().toISOString(), scenarioMinute: state.now };
  return { ...state, bays, decisions: [...state.decisions, decision], revision: state.revision + 1, lastDecision: `Zatwierdzono ${variant.reason}` };
}

export function mutate(state: AppState, action: Record<string, unknown>): AppState {
  if (action.type === 'reset') return initialState();
  if (action.type === 'demo') {
    const seed = initialState();
    const extra: StopRequest = { id: 'demo-d2', mode: 'delivery', destination: 'shops', arrival: 690, duration: 15, vehicle: 'van', source: 'demo_seed', createdAt: 'scenariusz' };
    return { ...seed, requests: [...seed.requests, extra], revision: state.revision + 1 };
  }
  if (action.type === 'request') {
    const mode = action.mode as Mode;
    const destination = action.destination as Destination;
    const arrival = Number(action.arrival);
    const duration = Number(action.duration);
    const vehicle = action.vehicle as Vehicle;
    if (!MODES.includes(mode) || !Object.keys(DEST_LABEL).includes(destination) || !['car', 'van'].includes(vehicle) || !Number.isInteger(arrival) || !Number.isInteger(duration) || arrival < state.now || arrival > 1300 || duration < 5 || duration > MAX_DURATION[mode] || arrival + duration > 1320) throw new Error('Sprawdź godzinę, czas i rodzaj postoju.');
    const repeated = state.requests.some(r => r.source === 'user' && r.mode === mode && r.destination === destination && Math.abs(r.arrival - arrival) < 10 && Math.abs(r.duration - duration) < 10 && r.vehicle === vehicle);
    if (repeated) return state;
    const request: StopRequest = { id: crypto.randomUUID(), mode, destination, arrival, duration, vehicle, source: 'user', createdAt: new Date().toISOString() };
    return { ...state, requests: [...state.requests, request], revision: state.revision + 1 };
  }
  if (action.type === 'event') {
    const end = Number(action.end);
    const status = action.status as CityEvent['status'];
    if (!Number.isInteger(end) || end < state.now || end > 1320 || !['planned', 'cancelled'].includes(status)) throw new Error('Nieprawidłowe dane wydarzenia.');
    return { ...state, event: { ...state.event, end, status, nearby: action.nearby === true, updatedAt: new Date().toISOString() }, revision: state.revision + 1 };
  }
  if (action.type === 'bay') {
    const bayId = String(action.bayId);
    const current = state.bays.find(b => b.id === bayId);
    if (!current) throw new Error('Nieznana zatoka.');
    const previous = occupancyStatus(current, state.now);
    const desired = action.occupancy === 'reported_occupied' ? 'reported_occupied' as const : 'unknown' as const;
    const bays = state.bays.map(bay => bay.id === bayId ? { ...bay, closed: action.closed === true, occupancy: desired, occupancyAt: desired === 'reported_occupied' ? previous === 'reported_occupied' ? bay.occupancyAt : state.now : null } : bay);
    const observation: Observation[] = desired !== previous ? [{ id: crypto.randomUUID(), bayId, kind: desired === 'reported_occupied' ? 'occupied' : 'departed', source: 'operator_demo', scenarioMinute: state.now, recordedAt: new Date().toISOString() }] : [];
    return { ...state, bays, observations: [...state.observations, ...observation], revision: state.revision + 1 };
  }
  if (action.type === 'observation') {
    const bayId = String(action.bayId);
    const kind = action.kind as Observation['kind'];
    if (!state.bays.some(bay => bay.id === bayId) || !['arrived', 'departed', 'occupied'].includes(kind)) throw new Error('Nieprawidłowe zgłoszenie zajętości.');
    if (kind !== 'departed') {
      const arrival = Number(action.arrival);
      if (!Number.isInteger(arrival) || Math.abs(arrival - state.now) > 15) throw new Error('Zajętość zgłoś w ciągu 15 minut od przyjazdu.');
    }
    const observation: Observation = { id: crypto.randomUUID(), bayId, kind, source: 'user', scenarioMinute: state.now, recordedAt: new Date().toISOString() };
    const bays = state.bays.map(bay => bay.id === bayId ? { ...bay, occupancy: kind === 'departed' ? 'unknown' as const : 'reported_occupied' as const, occupancyAt: kind === 'departed' ? null : state.now } : bay);
    return { ...state, bays, observations: [...state.observations, observation], revision: state.revision + 1 };
  }
  if (action.type === 'advance') {
    const now = Number(action.now);
    if (!Number.isInteger(now) || now < state.now || now > 1260) throw new Error('Czas scenariusza może tylko iść do przodu.');
    return { ...state, now, revision: state.revision + 1 };
  }
  if (action.type === 'approve') return applyVariant(state, String(action.id));
  throw new Error('Nieznana akcja.');
}
