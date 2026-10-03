import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, applyVariant, availabilityHint, eventForecast, initialState, modeAt, mutate, occupancyEvidence, occupancyStatus, rankBays } from '../lib/core.ts';

test('pojedyncza potrzeba nie przełącza planu; kolejna zmienia rekomendację na przyszłość', () => {
  let state = initialState();
  assert.equal(analyze(state).recommendedId, 'keep');
  state = mutate(state, { type: 'request', mode: 'delivery', destination: 'shops', arrival: 690, duration: 15, vehicle: 'van' });
  const result = analyze(state);
  assert.equal(result.recommendedId, 'A-delivery');
  assert.equal(modeAt(state.bays[0], state.now), 'delivery');
  state = applyVariant(state, result.recommendedId);
  assert.equal(modeAt(state.bays[0], 720), 'delivery');
  assert.equal(state.decisions.length, 1);
  assert.equal(state.decisions[0].start, 660);
  assert.equal(state.decisions[0].scenarioMinute, 600);
});

test('postój musi się skończyć przed zmianą funkcji i pasować do pojazdu', () => {
  const state = initialState();
  assert.equal(rankBays(state, { mode: 'delivery', destination: 'shops', arrival: 650, duration: 15, vehicle: 'van' }).length, 0);
  assert.equal(rankBays(state, { mode: 'delivery', destination: 'shops', arrival: 630, duration: 15, vehicle: 'van' })[0].bay.id, 'A');
  assert.equal(rankBays(state, { mode: 'parking', destination: 'stop', arrival: 690, duration: 30, vehicle: 'van' }).some(x => x.bay.id === 'C'), false);
});

test('samo wydarzenie nie rekomenduje przełączenia zatoki', () => {
  const state = mutate(initialState(), { type: 'event_add', title: 'Koncert', end: 720, destination: 'stop' });
  const analysis = analyze(state);
  assert.equal(analysis.recommendedId, 'keep');
  assert.match(analysis.explanation, /wydarzenie/i);
  assert.equal(analysis.signals.forecasts, 2);
});

test('zamknięcie i świeże zgłoszenie zajęcia blokują wskazanie miejsca', () => {
  let state = initialState();
  state = mutate(state, { type: 'bay', bayId: 'A', closed: true, occupancy: 'unknown' });
  assert.equal(rankBays(state, { mode: 'delivery', destination: 'shops', arrival: 630, duration: 15, vehicle: 'van' }).length, 0);
  state = initialState();
  state = mutate(state, { type: 'bay', bayId: 'A', closed: false, occupancy: 'reported_occupied' });
  assert.equal(rankBays(state, { mode: 'delivery', destination: 'shops', arrival: 600, duration: 15, vehicle: 'van' }).length, 0);
  assert.equal(rankBays(state, { mode: 'delivery', destination: 'shops', arrival: 630, duration: 15, vehicle: 'van' }).length, 1);
  state = mutate(state, { type: 'advance', now: 630 });
  assert.equal(occupancyStatus(state.bays[0], state.now), 'unknown');
});

test('ponowne wyszukanie pokazuje wynik bez zawyżania popytu', () => {
  const action = { type: 'request', mode: 'delivery', destination: 'shops', arrival: 690, duration: 15, vehicle: 'van' };
  const state = mutate(initialState(), action);
  const again = mutate(state, action);
  assert.equal(again.requests.length, state.requests.length);
  assert.equal(again.revision, state.revision);
});

test('przyjazd blokuje wskazanie, odjazd nie udaje pomiaru wolnego miejsca', () => {
  let state = mutate(initialState(), { type: 'observation', bayId: 'A', kind: 'arrived', arrival: 600 });
  assert.equal(state.observations.length, 1);
  assert.equal(rankBays(state, { mode: 'delivery', destination: 'shops', arrival: 600, duration: 15, vehicle: 'van' }).length, 0);
  assert.match(occupancyEvidence(state, state.bays[0]), /Użytkownik zgłosił zajęcie/);
  state = mutate(state, { type: 'observation', bayId: 'A', kind: 'departed' });
  assert.equal(occupancyStatus(state.bays[0], state.now), 'unknown');
  assert.match(occupancyEvidence(state, state.bays[0]), /wolne miejsce niepotwierdzone/);
  assert.equal(state.observations.length, 2);
});

test('stare zgłoszenie zajęcia traci ważność i nie jest prezentowane jako pomiar', () => {
  let state = mutate(initialState(), { type: 'observation', bayId: 'A', kind: 'occupied', arrival: 600 });
  state = mutate(state, { type: 'advance', now: 630 });
  assert.equal(occupancyStatus(state.bays[0], state.now), 'unknown');
  assert.match(occupancyEvidence(state, state.bays[0]), /nieaktualne/);
});

test('potwierdzony przyjazd daje krótką, niepewną wskazówkę po deklarowanym końcu', () => {
  let state = mutate(initialState(), { type: 'advance', now: 660 });
  state = mutate(state, { type: 'request', mode: 'parking', destination: 'food', arrival: 660, duration: 30, vehicle: 'car' });
  assert.equal(availabilityHint(state, state.bays[1], 690), null);
  state = mutate(state, { type: 'observation', bayId: 'B', kind: 'arrived', arrival: 660, duration: 30, mode: 'parking' });
  assert.equal(state.observations.at(-1).expectedEnd, 690);
  state = mutate(state, { type: 'advance', now: 680 });
  assert.equal(occupancyStatus(state.bays[1], state.now), 'unknown');
  assert.equal(availabilityHint(state, state.bays[1], 680)?.kind, 'expected_occupied');
  assert.equal(rankBays(state, { mode: 'parking', destination: 'food', arrival: 680, duration: 10, vehicle: 'car' }).some(match => match.bay.id === 'B'), false);
  assert.equal(availabilityHint(state, state.bays[1], 690)?.kind, 'possible_free');
  assert.equal(rankBays(state, { mode: 'parking', destination: 'food', arrival: 690, duration: 10, vehicle: 'car' }).some(match => match.bay.id === 'B'), true);
  state = mutate(state, { type: 'advance', now: 706 });
  assert.equal(availabilityHint(state, state.bays[1], 706), null);
});

test('odjazd daje świeżą wskazówkę, a nowsze zajęcie ją usuwa', () => {
  let state = mutate(initialState(), { type: 'advance', now: 660 });
  state = mutate(state, { type: 'observation', bayId: 'B', kind: 'arrived', arrival: 660, duration: 30, mode: 'parking' });
  state = mutate(state, { type: 'advance', now: 665 });
  state = mutate(state, { type: 'observation', bayId: 'B', kind: 'departed' });
  assert.equal(availabilityHint(state, state.bays[1], 665)?.kind, 'possible_free');
  state = mutate(state, { type: 'observation', bayId: 'B', kind: 'occupied', arrival: 665 });
  assert.equal(availabilityHint(state, state.bays[1], 665), null);
  assert.equal(rankBays(state, { mode: 'parking', destination: 'food', arrival: 665, duration: 10, vehicle: 'car' }).some(match => match.bay.id === 'B'), false);
});

test('przyszłego przyjazdu nie można zgłosić jako zajęcia teraz', () => {
  assert.throws(() => mutate(initialState(), { type: 'observation', bayId: 'A', kind: 'arrived', arrival: 690 }), /15 minut/);
});

test('operator może wycofać zgłoszenie bez ogłaszania miejsca wolnym', () => {
  let state = mutate(initialState(), { type: 'bay', bayId: 'A', closed: false, occupancy: 'reported_occupied' });
  state = mutate(state, { type: 'bay', bayId: 'A', closed: false, occupancy: 'unknown' });
  assert.equal(state.observations.length, 2);
  assert.equal(state.observations.at(-1).kind, 'departed');
  assert.match(occupancyEvidence(state, state.bays[0]), /niepotwierdzone/);
});

test('jedno kliknięcie przygotowuje powtarzalny scenariusz dla jury', () => {
  const state = mutate(initialState(), { type: 'demo' });
  assert.equal(state.requests.length, 5);
  assert.equal(analyze(state).recommendedId, 'A-delivery');
  assert.equal(state.observations.length, 0);
  assert.equal(analyze(state).variants.some(variant => variant.id === 'C-delivery'), false);
});

test('scenariusz parkingu pokazuje niepewną wolną zatokę, którą można zgłosić jako zajętą', () => {
  let state = mutate(initialState(), { type: 'scene', scene: 'parking' });
  const search = { mode: 'parking', destination: 'shops', arrival: state.now, duration: 30, vehicle: 'car' };
  assert.equal(state.scene, 'parking');
  assert.equal(availabilityHint(state, state.bays[1], state.now)?.kind, 'possible_free');
  assert.equal(rankBays(state, search)[0].bay.id, 'B');
  state = mutate(state, { type: 'observation', bayId: 'B', kind: 'occupied', arrival: state.now });
  assert.equal(rankBays(state, search).some(match => match.bay.id === 'B'), false);
  assert.equal(rankBays(state, search)[0].bay.id, 'C');
});

test('scenariusze dostaw i wydarzenia prowadzą do różnych decyzji miasta', () => {
  const delivery = mutate(initialState(), { type: 'scene', scene: 'delivery' });
  const event = mutate(initialState(), { type: 'scene', scene: 'event' });
  assert.equal(analyze(delivery).recommendedId, 'A-delivery');
  assert.equal(analyze(event).recommendedId, 'C-pickup');
  assert.equal(event.events[0].source, 'demo');
});

test('wydarzenie można dodać i odwołać, a prognoza nie udaje zgłoszeń', () => {
  let state = mutate(initialState(), { type: 'event_add', title: 'Koncert przy przystanku', end: 960, destination: 'stop' });
  assert.equal(state.events.length, 1);
  assert.equal(analyze(state).recommendedId, 'keep');
  const id = state.events[0].id;
  state = mutate(state, { type: 'event_cancel', id });
  assert.equal(state.events[0].status, 'cancelled');
  assert.equal(analyze(state).signals.forecasts, 0);
  assert.throws(() => mutate(state, { type: 'event_cancel', id }), /aktywnego/);
});

test('późne wydarzenie wraz ze zgłoszeniem może wskazać przyszłe okno', () => {
  let state = mutate(initialState(), { type: 'event_add', title: 'Wieczorny koncert', end: 960, destination: 'stop' });
  state = mutate(state, { type: 'request', mode: 'pickup', destination: 'stop', arrival: 945, duration: 10, vehicle: 'car' });
  const result = analyze(state);
  assert.ok(result.start >= 900);
  assert.equal(result.recommendedId, 'C-pickup');
  assert.equal(result.signals.requests, 1);
  assert.equal(result.signals.forecasts, 1);
});

test('nakładające się wydarzenia nie mnożą sztucznych odbiorów', () => {
  let state = mutate(initialState(), { type: 'event_add', title: 'Koncert pierwszy', end: 960, destination: 'stop' });
  state = mutate(state, { type: 'event_add', title: 'Koncert drugi', end: 960, destination: 'stop' });
  assert.equal(eventForecast(state, 900, 1020).length, 2);
  state = mutate(state, { type: 'request', mode: 'pickup', destination: 'stop', arrival: 945, duration: 10, vehicle: 'car' });
  assert.equal(eventForecast(state, 900, 1020).length, 1);
});
