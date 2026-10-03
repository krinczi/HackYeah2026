export type Mode = 'delivery' | 'parking' | 'pickup';
export type DemoScene = 'parking' | 'delivery' | 'event';
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
  id: string;
  title: string;
  end: number;
  destination: Destination;
  status: 'planned' | 'cancelled';
  source: 'demo' | 'operator_demo';
  updatedAt?: string | null;
};
export type Observation = {
  id: string;
  bayId: string;
  kind: 'arrived' | 'departed' | 'occupied';
  source: 'user' | 'operator_demo';
  scenarioMinute: number;
  expectedEnd?: number;
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
  scene?: DemoScene | null;
  bays: Bay[];
  requests: StopRequest[];
  observations: Observation[];
  decisions: PlanDecision[];
  events: CityEvent[];
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
export type Analysis = { start: number; end: number; variants: Variant[]; recommendedId: string; confidence: 'low'; explanation: string; signals: { requests: number; forecasts: number; servedBefore: number; servedAfter: number } };

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
    scene: null,
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
    events: [],
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

export type AvailabilityHint = { kind: 'expected_occupied' | 'possible_free'; label: string; detail: string };

export function availabilityHint(state: AppState, bay: Bay, at: number): AvailabilityHint | null {
  if (bay.closed) return null;
  const latest = [...state.observations].reverse().find(item => item.bayId === bay.id && item.scenarioMinute <= at);
  if (!latest) return null;
  if (latest.kind === 'departed' && latest.source === 'user' && at - latest.scenarioMinute <= 15) {
    return { kind: 'possible_free', label: 'Może być wolne', detail: `Odjazd zgłoszony o ${formatTime(latest.scenarioMinute)} · niska pewność, miejsce mogło zostać zajęte ponownie.` };
  }
  if (latest.kind !== 'arrived' || latest.expectedEnd === undefined) return null;
  if (at < latest.expectedEnd) {
    return { kind: 'expected_occupied', label: 'Przewidywany postój', detail: `${latest.source === 'operator_demo' ? 'Przykładowy przyjazd' : 'Przyjazd zgłoszony'} o ${formatTime(latest.scenarioMinute)} · deklarowany koniec postoju ${formatTime(latest.expectedEnd)}.` };
  }
  if (at <= latest.expectedEnd + 15) {
    return { kind: 'possible_free', label: 'Może być wolne', detail: `${latest.source === 'operator_demo' ? 'Przykładowy' : 'Deklarowany'} postój skończył się o ${formatTime(latest.expectedEnd)} · brak potwierdzenia odjazdu, niska pewność.` };
  }
  return null;
}

function recentOccupied(state: AppState, bay: Bay, arrival: number): boolean {
  const hint = availabilityHint(state, bay, arrival);
  if (hint) return hint.kind === 'expected_occupied';
  return occupancyStatus(bay, state.now) === 'reported_occupied' && arrival <= state.now + 15;
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
    .filter(bay => !recentOccupied(state, bay, input.arrival))
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
  const candidates = state.events.filter(event => event.status === 'planned').flatMap(event =>
    [event.end - 15, event.end + 10].map((arrival, n) => ({ id: `forecast-${event.id}-${n}`, mode: 'pickup' as const, destination: event.destination, arrival, duration: 10, vehicle: 'car' as const, source: 'demo_seed' as const, createdAt: 'założenie demonstracyjne' }))
      .filter(request => request.arrival >= start && request.arrival < end && request.arrival + request.duration <= 1320)
      .filter(request => !state.requests.some(real => real.mode === 'pickup' && real.destination === request.destination && Math.abs(real.arrival - request.arrival) <= 12)))
    .sort((a, b) => a.arrival - b.arrival);
  const forecasts: StopRequest[] = [];
  for (const candidate of candidates) {
    if (forecasts.filter(request => request.destination === candidate.destination).length >= 2) continue;
    if (forecasts.some(request => request.destination === candidate.destination && Math.abs(request.arrival - candidate.arrival) <= 12)) continue;
    forecasts.push(candidate);
  }
  return forecasts;
}

function simulate(state: AppState, bays: Bay[], start: number, end: number): Outcome[] {
  const requests = [...state.requests.filter(r => r.arrival >= start && r.arrival < end), ...eventForecast(state, start, end)]
    .sort((a, b) => a.arrival - b.arrival || WEIGHT[b.mode] - WEIGHT[a.mode]);
  const occupiedUntil = new Map<string, number>();
  return requests.map(request => {
    const possible = bays
      .filter(bay => (request.vehicle !== 'van' || bay.van) && validThroughout(bay, request.mode, request.arrival, request.duration))
      .filter(bay => !recentOccupied(state, bay, request.arrival) && (occupiedUntil.get(bay.id) ?? 0) <= request.arrival)
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
  const unmetPenalty = outcomes.filter(o => !o.served).reduce((sum, o) => sum + WEIGHT[o.mode] * (o.forecast ? 0.5 : 1), 0);
  const distancePenalty = outcomes.filter(o => o.served).reduce((sum, o) => sum + (o.distance ?? 0) / 200 * (o.forecast ? 0.5 : 1), 0);
  const score = Math.round((unmetPenalty + changes * 2 + distancePenalty) * 10) / 10;
  const reason = bayId && mode ? `${bayId}: ${MODE_LABEL[mode].toLowerCase()} ${formatTime(start)}–${formatTime(end)}` : 'Zachowaj obecny plan';
  return { id: bayId && mode ? `${bayId}-${mode}` : 'keep', bayId, mode, start, end, score, outcomes, served, unmet, changes, reason };
}

export function analyze(state: AppState): Analysis {
  const first = Math.min(1260, Math.max(660, Math.ceil((state.now + 30) / 60) * 60));
  const windows = [] as { start: number; end: number; variants: Variant[]; recommendedId: string; gain: number; attention: number }[];
  for (let start = first; start < 1320; start += 60) {
    const end = Math.min(1320, start + 120);
    const keep = makeVariant(state, start, end, null, null);
    const variants = [keep];
    for (const bay of state.bays) {
      if (bay.closed || recentOccupied(state, bay, start) || state.decisions.some(d => d.bayId === bay.id && d.start < end && d.end > start)) continue;
      const latest = [...state.observations].reverse().find(o => o.bayId === bay.id && o.scenarioMinute <= start);
      if (latest?.kind === 'arrived' && (latest.expectedEnd ?? 0) > start) continue;
      for (const mode of MODES) {
        if (mode === 'delivery' && !bay.van) continue;
        if (modeAt(bay, start) === mode) continue;
        variants.push(makeVariant(state, start, end, bay.id, mode));
      }
    }
    variants.sort((a, b) => a.score - b.score || a.changes - b.changes || a.id.localeCompare(b.id));
    const forecasts = eventForecast(state, start, end);
    const eligible = variants.filter(v => {
      if (v.id === 'keep' || keep.score - v.score < 2) return false;
      const signals = state.requests.filter(r => r.mode === v.mode && r.arrival >= start && r.arrival < end).length;
      if (signals < (v.mode === 'pickup' && forecasts.length ? 1 : 2)) return false;
      const gained = v.outcomes.filter(o => !o.forecast && o.served && !keep.outcomes.find(k => k.requestId === o.requestId)?.served).length;
      const lost = keep.outcomes.filter(o => !o.forecast && o.served && !v.outcomes.find(k => k.requestId === o.requestId)?.served).length;
      return gained > 0 && lost <= gained;
    });
    const best = eligible[0];
    const attention = keep.outcomes.filter(o => !o.served).reduce((sum, o) => sum + (o.forecast ? 0.1 : WEIGHT[o.mode]), 0);
    windows.push({ start, end, variants, recommendedId: best?.id ?? 'keep', gain: best ? keep.score - best.score : 0, attention });
  }
  const selected = [...windows].sort((a, b) => (b.recommendedId !== 'keep' ? 1 : 0) - (a.recommendedId !== 'keep' ? 1 : 0) || b.gain - a.gain || b.attention - a.attention || a.start - b.start)[0];
  const keep = selected.variants.find(v => v.id === 'keep')!;
  const chosen = selected.variants.find(v => v.id === selected.recommendedId)!;
  const requests = state.requests.filter(r => r.arrival >= selected.start && r.arrival < selected.end).length;
  const forecasts = eventForecast(state, selected.start, selected.end).length;
  const servedBefore = keep.outcomes.filter(o => o.served && !o.forecast).length;
  const servedAfter = chosen.outcomes.filter(o => o.served && !o.forecast).length;
  const explanation = selected.recommendedId !== 'keep'
    ? `Obsłużone zgłoszenia w symulacji: ${servedBefore} → ${servedAfter}. Uwzględniono też koszt przełączenia i dojście do celu.`
    : forecasts && !state.requests.some(r => r.mode === 'pickup' && r.arrival >= selected.start && r.arrival < selected.end)
      ? 'Wydarzenie sygnalizuje możliwe odbiory, ale bez zgłoszeń użytkowników nie rekomendujemy zmiany.'
      : requests ? 'Żaden wariant nie daje dziś wystarczającej korzyści, aby zmieniać plan.' : 'Brak zgłoszeń dla tego okna. Obecny plan pozostaje najbezpieczniejszym wyborem.';
  return { start: selected.start, end: selected.end, variants: selected.variants, recommendedId: selected.recommendedId, confidence: 'low', explanation, signals: { requests, forecasts, servedBefore, servedAfter } };
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
  if (action.type === 'scene') {
    const scene = String(action.scene) as DemoScene;
    const seed = initialState();
    if (scene === 'parking') {
      const observation: Observation = { id: 'scene-parking-b', bayId: 'B', kind: 'arrived', source: 'operator_demo', scenarioMinute: 600, expectedEnd: 630, recordedAt: 'scenariusz' };
      return { ...seed, scene, now: 630, bays: seed.bays.map(bay => bay.id === 'B' ? { ...bay, occupancy: 'reported_occupied' as const, occupancyAt: 600 } : bay), observations: [observation], revision: state.revision + 1 };
    }
    if (scene === 'delivery') {
      const extra: StopRequest = { id: 'scene-delivery-2', mode: 'delivery', destination: 'shops', arrival: 690, duration: 15, vehicle: 'van', source: 'demo_seed', createdAt: 'scenariusz' };
      return { ...seed, scene, requests: [...seed.requests, extra], revision: state.revision + 1 };
    }
    if (scene === 'event') {
      const pickups: StopRequest[] = [690, 715, 740].map((arrival, index) => ({ id: `scene-pickup-${index}`, mode: 'pickup', destination: 'stop', arrival, duration: 10, vehicle: 'car', source: 'demo_seed', createdAt: 'scenariusz' }));
      const event: CityEvent = { id: 'scene-event', title: 'Koniec wydarzenia', end: 720, destination: 'stop', status: 'planned', source: 'demo', updatedAt: null };
      return { ...seed, scene, now: 630, requests: pickups, events: [event], revision: state.revision + 1 };
    }
    throw new Error('Nieznany scenariusz.');
  }
  if (action.type === 'demo') {
    return mutate(state, { type: 'scene', scene: 'delivery' });
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
  if (action.type === 'event_add') {
    const title = String(action.title ?? '').trim();
    const end = Number(action.end);
    const destination = action.destination as Destination;
    if (title.length < 3 || title.length > 60 || !Number.isInteger(end) || end < state.now + 30 || end > 1320 || !Object.keys(DEST_LABEL).includes(destination)) throw new Error('Podaj nazwę, okolicę i przyszłą godzinę zakończenia.');
    const event: CityEvent = { id: crypto.randomUUID(), title, end, destination, status: 'planned', source: 'operator_demo', updatedAt: new Date().toISOString() };
    return { ...state, events: [...state.events, event], revision: state.revision + 1 };
  }
  if (action.type === 'event_cancel') {
    const id = String(action.id);
    if (!state.events.some(event => event.id === id && event.status === 'planned')) throw new Error('Nie znaleziono aktywnego wydarzenia.');
    return { ...state, events: state.events.map(event => event.id === id ? { ...event, status: 'cancelled' as const, updatedAt: new Date().toISOString() } : event), revision: state.revision + 1 };
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
    const selectedBay = state.bays.find(bay => bay.id === bayId);
    if (!selectedBay || !['arrived', 'departed', 'occupied'].includes(kind)) throw new Error('Nieprawidłowe zgłoszenie zajętości.');
    let expectedEnd: number | undefined;
    if (kind !== 'departed') {
      const arrival = Number(action.arrival);
      if (!Number.isInteger(arrival) || Math.abs(arrival - state.now) > 15) throw new Error('Zajętość zgłoś w ciągu 15 minut od przyjazdu.');
      if (kind === 'arrived' && action.duration !== undefined) {
        const duration = Number(action.duration);
        const mode = action.mode as Mode;
        if (!MODES.includes(mode) || !Number.isInteger(duration) || !validThroughout(selectedBay, mode, arrival, duration)) throw new Error('Sprawdź czas i funkcję wybranej zatoki.');
        expectedEnd = arrival + duration;
      }
    }
    const observation: Observation = { id: crypto.randomUUID(), bayId, kind, source: 'user', scenarioMinute: state.now, expectedEnd, recordedAt: new Date().toISOString() };
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
