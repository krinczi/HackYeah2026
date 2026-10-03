import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, applyVariant, availabilityHint, DEMO_BAY_POINTS, distanceMeters, eventForecast, formatTime, initialState, modeAt, mutate, nearestDemoBay, occupancyEvidence, occupancyStatus, rankBays } from '../lib/core.ts';

const eventAction = (title, end, bayId = 'C') => {
  const day = initialState().scenarioDate;
  return { type: 'event_add', title, placeLabel: `Punkt przy zatoce ${bayId}`, startAt: `${day}T${formatTime(end - 120)}`, endAt: `${day}T${formatTime(end)}`, lat: DEMO_BAY_POINTS[bayId].lat, lng: DEMO_BAY_POINTS[bayId].lng };
};

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
  const state = mutate(initialState(), eventAction('Koncert', 720));
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

test('zamknięcie zatoki nie zmienia zgłoszeń zajętości', () => {
  const occupied = mutate(initialState(), { type: 'bay', bayId: 'A', closed: false, occupancy: 'reported_occupied' });
  const closed = mutate(occupied, { type: 'bay_closure', bayId: 'A', closed: true });
  assert.equal(closed.bays[0].closed, true);
  assert.equal(closed.bays[0].occupancy, 'reported_occupied');
  assert.deepEqual(closed.observations, occupied.observations);
  const reopened = mutate(closed, { type: 'bay_closure', bayId: 'A', closed: false });
  assert.equal(reopened.bays[0].closed, false);
  assert.deepEqual(reopened.observations, occupied.observations);
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

test('ta sama zatoka dopuszcza wieczorny odbiór, ale nie postój przez zmianę funkcji', () => {
  const state = initialState();
  const bay = state.bays[0];
  assert.equal(modeAt(bay, 1079), 'parking');
  assert.equal(modeAt(bay, 1080), 'pickup');
  assert.equal(rankBays(state, { mode: 'pickup', destination: 'stop', arrival: 1080, duration: 10, vehicle: 'car' })[0].bay.id, 'A');
  assert.equal(rankBays(state, { mode: 'parking', destination: 'shops', arrival: 1070, duration: 30, vehicle: 'car' }).some(match => match.bay.id === 'A'), false);
  assert.equal(rankBays(state, { mode: 'pickup', destination: 'stop', arrival: 1070, duration: 10, vehicle: 'car' }).length, 0);
});

test('wieczorny scenariusz odbioru pokazuje zatokę C i obowiązujący znak', () => {
  const state = mutate(initialState(), { type: 'scene', scene: 'pickup' });
  const matches = rankBays(state, { mode: 'pickup', destination: 'stop', arrival: state.now, duration: 10, vehicle: 'car' });
  assert.equal(state.now, 1200);
  assert.equal(state.decisions[0].mode, 'pickup');
  assert.equal(matches[0].bay.id, 'C');
  assert.equal(modeAt(state.bays[2], state.now), 'pickup');
  assert.equal(modeAt(state.bays[2], 1260), 'parking');
});

test('wydarzenie można dodać i odwołać, a prognoza nie udaje zgłoszeń', () => {
  let state = mutate(initialState(), eventAction('Koncert przy przystanku', 960));
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0].startAt, `${state.scenarioDate}T14:00`);
  assert.equal(state.events[0].endAt, `${state.scenarioDate}T16:00`);
  assert.equal(analyze(state).recommendedId, 'keep');
  const id = state.events[0].id;
  state = mutate(state, { type: 'event_cancel', id });
  assert.equal(state.events[0].status, 'cancelled');
  assert.equal(analyze(state).signals.forecasts, 0);
  assert.throws(() => mutate(state, { type: 'event_cancel', id }), /aktywnego/);
});

test('początek może przypadać poprzedniego dnia, ale koniec musi być w dniu scenariusza i po początku', () => {
  const state = initialState();
  const previousDay = new Date(Date.parse(`${state.scenarioDate}T12:00:00Z`) - 86400000).toISOString().slice(0, 10);
  const overnight = mutate(state, { ...eventAction('Nocne wydarzenie', 720), startAt: `${previousDay}T23:00` });
  assert.equal(overnight.events[0].startAt, `${previousDay}T23:00`);
  assert.equal(eventForecast(overnight, 660, 780).length, 2);
  assert.throws(() => mutate(state, { ...eventAction('Błędna kolejność', 720), startAt: `${state.scenarioDate}T13:00` }), /początek|koniec/i);
  assert.throws(() => mutate(state, { ...eventAction('Inny dzień', 720), endAt: `${previousDay}T12:00` }), /dniu scenariusza/i);
});

test('późne wydarzenie wraz ze zgłoszeniem może wskazać przyszłe okno', () => {
  let state = mutate(initialState(), eventAction('Wieczorny koncert', 960));
  state = mutate(state, { type: 'request', mode: 'pickup', destination: 'stop', arrival: 945, duration: 10, vehicle: 'car' });
  const result = analyze(state);
  assert.ok(result.start >= 900);
  assert.equal(result.recommendedId, 'C-pickup');
  assert.equal(result.signals.requests, 1);
  assert.equal(result.signals.forecasts, 1);
});

test('nakładające się wydarzenia nie mnożą sztucznych odbiorów', () => {
  let state = mutate(initialState(), eventAction('Koncert pierwszy', 960));
  state = mutate(state, eventAction('Koncert drugi', 960));
  assert.equal(eventForecast(state, 900, 1020).length, 2);
  state = mutate(state, { type: 'request', mode: 'pickup', destination: 'stop', arrival: 945, duration: 10, vehicle: 'car' });
  assert.equal(eventForecast(state, 900, 1020).length, 1);
});

test('punkt wydarzenia wpływa na najbliższą zatokę, a odległy punkt jest odrzucany', () => {
  const point = DEMO_BAY_POINTS.A;
  assert.equal(distanceMeters(point, point), 0);
  assert.equal(nearestDemoBay(point).id, 'A');
  let state = mutate(initialState(), eventAction('Wydarzenie przy A', 960, 'A'));
  state = mutate(state, { type: 'request', mode: 'pickup', destination: 'shops', arrival: 945, duration: 10, vehicle: 'car' });
  assert.equal(analyze(state).recommendedId, 'A-pickup');
  assert.equal(eventForecast(state, 900, 1020)[0].location.lat, point.lat);
  assert.throws(() => mutate(initialState(), { ...eventAction('Daleko', 960), placeLabel: 'Poza odcinkiem', lat: 52.22, lng: 21.01 }), /obszarze pilotażu/);
});
