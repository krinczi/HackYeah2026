import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, applyVariant, initialState, modeAt, mutate, occupancyEvidence, occupancyStatus, rankBays } from '../lib/core.ts';

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
  const state = mutate(initialState(), { type: 'event', status: 'planned', end: 720, nearby: true });
  const analysis = analyze(state);
  assert.equal(analysis.recommendedId, 'keep');
  assert.match(analysis.explanation, /wydarzenie/i);
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

test('identyczne zgłoszenie nie zawyża sztucznie popytu', () => {
  const action = { type: 'request', mode: 'delivery', destination: 'shops', arrival: 690, duration: 15, vehicle: 'van' };
  const state = mutate(initialState(), action);
  assert.throws(() => mutate(state, action), /Podobne zgłoszenie/);
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
