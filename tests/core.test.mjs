import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, applyVariant, initialState, modeAt, mutate, occupancyStatus, rankBays } from '../lib/core.ts';

test('pojedyncza potrzeba nie przełącza planu; kolejna zmienia rekomendację na przyszłość', () => {
  let state = initialState();
  assert.equal(analyze(state).recommendedId, 'keep');
  state = mutate(state, { type: 'request', mode: 'delivery', destination: 'shops', arrival: 690, duration: 15, vehicle: 'van' });
  const result = analyze(state);
  assert.equal(result.recommendedId, 'A-delivery');
  assert.equal(modeAt(state.bays[0], state.now), 'delivery');
  state = applyVariant(state, result.recommendedId);
  assert.equal(modeAt(state.bays[0], 720), 'delivery');
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
