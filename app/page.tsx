'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { availabilityHint, DEST_LABEL, formatTime, MAX_DURATION, MODE_LABEL, modeAt, occupancyEvidence, occupancyStatus, rankBays, type Analysis, type AppState, type Bay, type DemoScene, type Destination, type Mode, type Vehicle } from '@/lib/core';
import BayMap from './bay-map';

type Payload = { state: AppState; analysis: Analysis };
type Tab = 'driver' | 'city' | 'sign';
type DriverStep = 'intent' | 'details' | 'results';
type SearchInput = { mode: Mode; destination: Destination; arrival: number; duration: number; vehicle: Vehicle };
const SCENES: { id: DemoScene; title: string; note: string }[] = [
  { id: 'parking', title: 'Czy już wolne?', note: 'Kliknij „Miejsce zajęte” przy B — wynik od razu się zmieni.' },
  { id: 'delivery', title: 'Dwie dostawy', note: 'Zatwierdź proponowaną zmianę A, potem obejrzyj znak.' },
  { id: 'event', title: 'Po wydarzeniu', note: 'Zatwierdź C dla odbiorów po wydarzeniu.' },
];

function nextMode(bay: Bay, at: number) {
  return bay.slots.find(slot => slot.start > at);
}

function nextPossible(state: AppState, input: SearchInput): number | null {
  for (let time = input.arrival + 15; time <= Math.min(1300, input.arrival + 180); time += 15) {
    if (rankBays(state, { ...input, arrival: time }).length) return time;
  }
  return null;
}

function ModeBadge({ mode }: { mode: Mode | null }) {
  return <span className={`mode-badge ${mode ?? 'unknown'}`}>{mode ? MODE_LABEL[mode] : 'Poza planem'}</span>;
}

function BayRibbon({ bay, now }: { bay: Bay; now: number }) {
  const hours = [10, 11, 12, 13, 14, 15, 16, 17, 18];
  return <div className="ribbon-row">
    <div className="ribbon-name"><strong>{bay.id}</strong><span>{bay.closed ? 'Wyłączona' : bay.name}</span></div>
    <div className="ribbon-cells">
      {hours.map(hour => {
        const minute = hour * 60;
        const mode = modeAt(bay, minute);
        return <div key={hour} className={`ribbon-cell ${bay.closed ? 'closed' : mode ?? 'unknown'} ${minute <= now && now < minute + 60 ? 'is-now' : ''}`} title={`${formatTime(minute)} · ${mode ? MODE_LABEL[mode] : 'brak danych'}`}><span>{mode === 'delivery' ? 'D' : mode === 'parking' ? 'P' : mode === 'pickup' ? 'O' : '–'}</span></div>;
      })}
    </div>
  </div>;
}

export default function Home() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [tab, setTab] = useState<Tab>('driver');
  const [driverStep, setDriverStep] = useState<DriverStep>('intent');
  const [input, setInput] = useState<SearchInput>({ mode: 'delivery', destination: 'shops', arrival: 600, duration: 15, vehicle: 'van' });
  const [submitted, setSubmitted] = useState<SearchInput | null>(null);
  const [demoScene, setDemoScene] = useState<DemoScene | null>(null);
  const [activeBayId, setActiveBayId] = useState<string | null>(null);
  const [activeStopEnd, setActiveStopEnd] = useState<number | null>(null);
  const [selectedBayId, setSelectedBayId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [eventEnd, setEventEnd] = useState(720);
  const [eventStatus, setEventStatus] = useState<'planned' | 'cancelled'>('cancelled');
  const [eventNearby, setEventNearby] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/state', { cache: 'no-store' });
      if (!response.ok) throw new Error('Brak połączenia z aplikacją.');
      const data = await response.json() as Payload;
      setPayload(old => !old || data.state.revision !== old.state.revision ? data : old);
    } catch { setNotice('Nie można pobrać aktualnego stanu. Spróbuj odświeżyć stronę.'); }
  }, []);

  useEffect(() => { void refresh(); const timer = setInterval(() => void refresh(), 1500); return () => clearInterval(timer); }, [refresh]);
  useEffect(() => { if (payload) { setEventEnd(payload.state.event.end); setEventStatus(payload.state.event.status); setEventNearby(payload.state.event.nearby); } }, [payload?.state.event.end, payload?.state.event.status, payload?.state.event.nearby]);

  const act = useCallback(async (action: Record<string, unknown>, success: string) => {
    setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Nie udało się wykonać akcji.');
      setPayload(data as Payload); setNotice(success);
      return data as Payload;
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Błąd zapisu.'); return null; }
    finally { setBusy(false); }
  }, []);

  const state = payload?.state;
  const analysis = payload?.analysis;
  const matches = useMemo(() => state && submitted ? rankBays(state, submitted) : [], [state, submitted]);
  const futureTime = useMemo(() => state && submitted && matches.length === 0 ? nextPossible(state, submitted) : null, [state, submitted, matches.length]);
  const futureVariants = useMemo(() => {
    if (!analysis) return [];
    const keep = analysis.variants.find(v => v.id === 'keep');
    const changes = analysis.variants.filter(v => v.id !== 'keep').slice(0, 2);
    return keep ? [keep, ...changes] : changes;
  }, [analysis]);

  async function openScene(scene: DemoScene) {
    const result = await act({ type: 'scene', scene }, '');
    if (!result) return;
    setDemoScene(scene);
    setActiveBayId(null);
    setActiveStopEnd(null);
    setSelectedBayId(null);
    if (scene === 'parking') {
      const search: SearchInput = { mode: 'parking', destination: 'shops', arrival: result.state.now, duration: 30, vehicle: 'car' };
      setInput(search);
      setSubmitted(search);
      setDriverStep('results');
      setTab('driver');
    } else {
      setSubmitted(null);
      setDriverStep('intent');
      setTab('city');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function finishDemo() {
    if (!await act({ type: 'reset' }, '')) return;
    setDemoScene(null);
    setSubmitted(null);
    setDriverStep('intent');
    setTab('driver');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const demoIndex = demoScene ? SCENES.findIndex(scene => scene.id === demoScene) : -1;

  if (!state || !analysis) return <main className="loading">Ładowanie ulicy…</main>;

  return <main className="shell">
    <header className="topbar">
      <div className="wordmark"><span className="mark">T<span className="mark-slash">/</span>W</span><span>TuWolno<span className="question">?</span></span></div>
      <div className="top-meta"><span className="demo-pill">PROTOTYP · DANE DEMO</span></div>
    </header>

    <nav className="tabs" aria-label="Widoki aplikacji">
      <button className={tab === 'driver' ? 'active' : ''} onClick={() => setTab('driver')}>Szukam miejsca</button>
      <button className={tab !== 'driver' ? 'active' : ''} onClick={() => setTab('city')}>Dla miasta</button>
    </nav>
    {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Zamknij komunikat">×</button></div>}
    {demoScene && <section className="demo-tour" aria-label="Pokaz aplikacji"><div><span>DEMO {demoIndex + 1}/3 · ŚWIĘTOKRZYSKA</span><p>{SCENES[demoIndex].note} <a href="https://zdm.waw.pl/wp-content/uploads/2018/04/Raport_koncowy_Swietokrzyska_dostawy.pdf" target="_blank" rel="noopener noreferrer">Badanie ZDM 2018</a></p></div><button className="demo-tour-next" type="button" disabled={busy} onClick={() => demoIndex === SCENES.length - 1 ? void finishDemo() : void openScene(SCENES[demoIndex + 1].id)}>{demoIndex === SCENES.length - 1 ? 'Zakończ demo' : `Dalej: ${SCENES[demoIndex + 1].title}`}</button><button className="demo-tour-close" type="button" disabled={busy} onClick={() => void finishDemo()} aria-label="Zamknij demo">×</button></section>}

    {tab === 'driver' && <>
      {driverStep === 'intent' && <section className="intro simple-intro"><p className="eyebrow">JEDNA ZATOKA. RÓŻNE POTRZEBY.</p><h1>Gdzie chcesz<br/><em>się zatrzymać?</em></h1><p className="lede">Wybierz powód postoju. W następnym kroku podasz godzinę i zobaczysz, co wolno.</p><button className="demo-entry" type="button" disabled={busy} onClick={() => void openScene('parking')}>Pokaż demo ulicy <span aria-hidden="true">→</span></button></section>}
      {driverStep === 'intent' && <section className="intent-entry"><div className="section-heading"><span>KROK 1 Z 2</span><h2>Po co przyjeżdżasz?</h2></div><div className="intent-grid">
        {(['delivery', 'parking', 'pickup'] as Mode[]).map((mode, index) => <button key={mode} className={`intent-card ${mode}`} onClick={() => { setDemoScene(null); setInput({ ...input, mode, arrival: Math.max(input.arrival, state.now), duration: mode === 'pickup' ? 10 : mode === 'delivery' ? 15 : 30, vehicle: mode === 'delivery' ? 'van' : 'car' }); setSubmitted(null); setSelectedBayId(null); setDriverStep('details'); }}><span>0{index + 1} / {MODE_LABEL[mode].toUpperCase()}</span><strong>{mode === 'delivery' ? 'Dostarczam towar' : mode === 'parking' ? 'Chcę zaparkować' : 'Odbieram kogoś'}</strong><small>{mode === 'delivery' ? 'Krótki rozładunek blisko celu' : mode === 'parking' ? 'Postój na określony czas' : 'Szybkie zatrzymanie przy ulicy'}</small></button>)}
      </div><p className="intent-note">Pokazujemy, czy postój jest dozwolony. Wolne miejsce potwierdzimy tylko wtedy, gdy będziemy mieć pomiar.</p></section>}
      {driverStep !== 'intent' && <div className={`driver-layout focused ${driverStep === 'details' ? 'form-step' : 'result-step'}`}>
      {driverStep === 'details' && <section className="form-panel"><div className="section-heading"><span>KROK 2 Z 2 · {MODE_LABEL[input.mode].toUpperCase()}</span><h2>Kiedy i gdzie?</h2></div><button className="back-link" onClick={() => setDriverStep('intent')}>Zmień cel postoju</button>
        <div className="fields"><label>Cel podróży<select value={input.destination} onChange={e => setInput({ ...input, destination: e.target.value as Destination })}>{Object.entries(DEST_LABEL).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
        <label>Przyjazd<select value={input.arrival} onChange={e => setInput({ ...input, arrival: Number(e.target.value) })}>{Array.from({ length: 45 }, (_, i) => 600 + i * 15).filter(minute => minute >= state.now && minute <= 1300).map(minute => <option key={minute} value={minute}>{formatTime(minute)}</option>)}</select></label>
        <label>Czas postoju<select value={input.duration} onChange={e => setInput({ ...input, duration: Number(e.target.value) })}>{[10, 15, 20, 30, 45, 60, 90, 120].filter(n => n <= MAX_DURATION[input.mode]).map(n => <option key={n} value={n}>{n} min</option>)}</select></label>
        {input.mode === 'delivery' && <label>Pojazd<select value={input.vehicle} onChange={e => setInput({ ...input, vehicle: e.target.value as Vehicle })}><option value="van">Dostawczy</option><option value="car">Osobowy</option></select></label>}</div>
        <button className="primary" disabled={busy} onClick={async () => { const result = await act({ type: 'request', ...input }, ''); if (result) { setSubmitted({ ...input }); setSelectedBayId(null); setDriverStep('results'); } }}>Pokaż pasujące zatoki</button>
        <p className="fineprint">Zgłoszenie pokazuje popyt, ale nie rezerwuje miejsca. Po potwierdzeniu przyjazdu czas postoju pomoże oszacować, kiedy zatoka może się zwolnić.</p>
      </section>}
      {driverStep === 'results' && <section className="result-panel"><div className="section-heading"><span>WYNIK / {submitted ? formatTime(submitted.arrival) : 'TWÓJ POSTÓJ'}</span><h2>{activeBayId ? 'Twój postój' : submitted ? matches.length ? 'Tu wolno się zatrzymać' : 'Brak pasującej zatoki' : 'Zacznij nowe szukanie'}</h2></div><button className="back-link" onClick={() => { setSubmitted(null); setSelectedBayId(null); setDriverStep('details'); }}>Zmień godzinę lub miejsce</button>
        {activeBayId && <div className="active-stop"><span>TWÓJ POSTÓJ · ZATOKA {activeBayId}</span><strong>Przyjazd zgłoszony</strong><p>Deklarowany koniec postoju: {activeStopEnd === null ? 'nieznany' : formatTime(activeStopEnd)}. To szacunek, nie pomiar czujnika. Zgłoś odjazd, gdy rzeczywiście wyjedziesz.</p><button disabled={busy} onClick={async () => { if (await act({ type: 'observation', bayId: activeBayId, kind: 'departed' }, 'Odjazd zapisany. Wolne miejsce nie jest potwierdzone.')) { setActiveBayId(null); setActiveStopEnd(null); } }}>Odjeżdżam</button></div>}
        {!submitted && !activeBayId && <div className="empty-state"><p>Wybierz godzinę i sprawdź kolejną zatokę.</p></div>}
        {submitted && <>
          <p className="result-lead">{MODE_LABEL[submitted.mode]} · {formatTime(submitted.arrival)} · {submitted.duration} min. Zgodność z <strong>modelem zasad</strong>, bez gwarancji wolnego miejsca.</p>
          <div className="results-columns">
            <BayMap state={state} matches={matches} arrival={submitted.arrival} selectedBayId={selectedBayId} onSelectBay={setSelectedBayId} />
            <div className="result-list-column">
          {matches.length > 0 && <div className="match-list">{matches.map(({ bay, distance, occupancy }) => {
            const hint = availabilityHint(state, bay, submitted.arrival);
            return <article className={`match ${selectedBayId === bay.id ? 'map-selected' : ''}`} key={bay.id}>
              <div className="match-number">{bay.id}</div>
              <div className="match-body">
                <div className="match-title"><h3>{bay.name}</h3><button type="button" onClick={() => { setSelectedBayId(bay.id); document.getElementById('mapa-zatok')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>Na mapie</button></div>
                <p>{distance} m do celu <span>·</span> dostępność: <strong className={hint?.kind === 'possible_free' ? 'possible-free-label' : ''}>{hint?.kind === 'possible_free' ? 'może być wolne' : occupancy === 'unknown' ? 'brak potwierdzenia' : 'zgłoszono zajęcie'}</strong></p>
                <div className="match-modes"><ModeBadge mode={modeAt(bay, submitted.arrival)} />{nextMode(bay, submitted.arrival) && <small>od {formatTime(nextMode(bay, submitted.arrival)!.start)}: {MODE_LABEL[nextMode(bay, submitted.arrival)!.mode]}</small>}</div>
                <p className="evidence-line">{hint?.kind === 'possible_free' ? hint.detail : occupancyEvidence(state, bay)}</p>
                {Math.abs(submitted.arrival - state.now) <= 15 && <div className="match-actions">
                  <button disabled={busy || activeBayId !== null} onClick={async () => { if (await act({ type: 'observation', bayId: bay.id, kind: 'arrived', arrival: submitted.arrival, duration: submitted.duration, mode: submitted.mode }, `Przyjazd do zatoki ${bay.id} zapisany.`)) { setActiveBayId(bay.id); setActiveStopEnd(submitted.arrival + submitted.duration); setSubmitted(null); } }}>Zgłoś przyjazd</button>
                  <button disabled={busy} onClick={() => void act({ type: 'observation', bayId: bay.id, kind: 'occupied', arrival: submitted.arrival }, 'Dziękujemy. Szukamy innej zatoki.')}>Miejsce zajęte</button>
                </div>}
              </div>
            </article>;
          })}</div>}
          {matches.length === 0 && <div className="no-match"><strong>Nie kierujemy Cię do miejsca, w którym postój byłby niedozwolony.</strong><p>Twoja nieobsłużona potrzeba trafiła do porównania przyszłych planów.</p>{futureTime && <p>Najbliższy pasujący termin w tym modelu: <b>{formatTime(futureTime)}</b>.</p>}</div>}
            </div>
          </div>
        </>}
        {submitted && <p className="source-line">Źródło: modelowy plan zatok i zgłoszenia użytkowników. „Może być wolne” to krótki szacunek z deklarowanego czasu postoju lub zgłoszonego odjazdu, bez pomiaru i gwarancji.</p>}
      </section>}
    </div>}
    </>}

    {tab === 'city' && <div className="city-layout">
      <section className="city-entry"><div><span className="eyebrow">PANEL MIASTA · PROTOTYP</span><h1>Ulica ma swój rytm.</h1><p>Sprawdź rekomendację dla przyszłego okna. To miasto wybiera plan.</p></div><div className="city-entry-actions"><button className="back-link" onClick={() => setTab('sign')}>Zobacz widok zatoki</button></div></section>
      <section className="timeline-panel"><div className="section-heading compact"><span>ODCINEK / SCENARIUSZ</span><h2>Rytm ulicy</h2><p>Godzina scenariusza: <b>{formatTime(state.now)}</b>. Zatoki i odległości są demonstracyjne.</p></div>
        <div className="timeline-hours"><span></span>{[10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => <span key={h}>{h}:00</span>)}</div>
        <div className="ribbon">{state.bays.map(bay => <BayRibbon key={bay.id} bay={bay} now={state.now} />)}</div>
        <div className="legend"><span><i className="dot delivery"/>Dostawa</span><span><i className="dot parking"/>Parking</span><span><i className="dot pickup"/>Odbiór</span><span><i className="dot unknown"/>Wyłączona</span></div>
        <div className="demand-strip"><div><small>ZGŁOSZENIA</small><strong>{state.requests.length}</strong></div><div><small>DOSTAWY BEZ MIEJSCA</small><strong>{analysis.variants.find(v => v.id === 'keep')?.unmet.delivery ?? 0}</strong></div><div><small>PARKING BEZ MIEJSCA</small><strong>{analysis.variants.find(v => v.id === 'keep')?.unmet.parking ?? 0}</strong></div></div>
        <div className="evidence-panel"><span>DANE Z ULICY / DEMO</span><strong>{state.observations.length} zgłoszeń zajętości</strong><p>{state.observations.length ? `Ostatnie: zatoka ${state.observations.at(-1)!.bayId}, ${state.observations.at(-1)!.kind === 'departed' ? 'odjazd' : 'zajęcie'} o ${formatTime(state.observations.at(-1)!.scenarioMinute)}. To deklaracja, nie czujnik.` : 'Brak obserwacji. Zgłoszenia potrzeb służą prognozie, nie potwierdzają wolnego miejsca.'}</p></div>
      </section>
      <section className="decision-panel"><div className="section-heading compact"><span>DECYZJA / {formatTime(analysis.start)}–{formatTime(analysis.end)}</span><h2>Co zmienić dalej?</h2><p>Prognoza demonstracyjna oparta na zgłoszeniach i sygnale wydarzenia. Pewność: <b>niska</b>.</p></div>
        <div className="recommendation"><span>REKOMENDACJA</span><strong>{analysis.recommendedId === 'keep' ? 'Zachowaj plan' : analysis.variants.find(v => v.id === analysis.recommendedId)?.reason}</strong><p>{analysis.explanation}</p>{analysis.recommendedId !== 'keep' && <button disabled={busy} onClick={() => void act({ type: 'approve', id: analysis.recommendedId }, 'Zatwierdzono przyszły plan.')}>Zatwierdź ten plan</button>}</div>
        <details className="progressive-details"><summary>Porównaj inne warianty</summary><div className="variant-list">{futureVariants.map(variant => <article className={`variant ${variant.id === analysis.recommendedId ? 'recommended' : ''}`} key={variant.id}><div className="variant-head"><h3>{variant.reason}</h3>{variant.id === analysis.recommendedId && <span>polecany</span>}</div><div className="variant-stats"><span><b>{variant.served.delivery}</b> dostaw</span><span><b>{variant.served.parking}</b> postojów</span><span><b>{variant.served.pickup}</b> odbiorów</span><span><b>{variant.unmet.delivery + variant.unmet.parking + variant.unmet.pickup}</b> bez miejsca</span></div><button disabled={busy} onClick={() => void act({ type: 'approve', id: variant.id }, `Zapisano plan: ${variant.reason}.`)}>Wybierz plan</button></article>)}</div></details>
        <details className="progressive-details cadence-details"><summary>Jak często plan się zmienia?</summary><p>Algorytm może liczyć codziennie, ale miasto zatwierdza harmonogram z wyprzedzeniem. W pilotażu proponujemy przegląd co tydzień, później co 2–4 tygodnie. Wydarzenia mają osobny, wcześniej zatwierdzony plan.</p></details>
        <p className="fineprint">Niższy wynik oznacza mniej niezaspokojonych potrzeb, z kosztem zmiany planu. To symulacja zgłoszeń, nie pomiar całej ulicy.</p>
        {state.decisions.length > 0 && <div className="decision-log"><span>ZATWIERDZONE Z WYPRZEDZENIEM · DEMO</span>{state.decisions.slice(-3).reverse().map(decision => <p key={decision.id}><b>Zatoka {decision.bayId}</b> · {MODE_LABEL[decision.mode]} {formatTime(decision.start)}–{formatTime(decision.end)}<small>Zatwierdzono w scenariuszu o {formatTime(decision.scenarioMinute)}</small></p>)}</div>}
      </section>
      <details className="controls-panel"><summary>Scenariusze i ustawienia</summary><div className="section-heading compact"><span>SYGNAŁY / KONTROLA</span><h2>Sprawdź sytuacje brzegowe</h2></div>
        <div className="control-block">
          <h3>Wydarzenie w okolicy <span>DEMO</span></h3>
          <p>Planowany koniec może podnieść prognozę odbiorów. Sam w sobie nie wystarcza do rekomendacji zmiany.</p>
          <p className="event-source">{state.event.title} · źródło: scenariusz demonstracyjny · {state.event.updatedAt ? `zmieniono ${new Date(state.event.updatedAt).toLocaleString('pl-PL')}` : 'bez danych miejskich'}</p>
          <div className="control-fields"><label>Status<select value={eventStatus} onChange={e => setEventStatus(e.target.value as 'planned' | 'cancelled')}><option value="cancelled">Odwołane</option><option value="planned">Planowane</option></select></label><label>Koniec<select value={eventEnd} onChange={e => setEventEnd(Number(e.target.value))}>{[660, 690, 720, 750, 780, 810, 840, 900].filter(n => n >= state.now).map(n => <option key={n} value={n}>{formatTime(n)}</option>)}</select></label></div>
          <label className="check"><input type="checkbox" checked={eventNearby} onChange={e => setEventNearby(e.target.checked)}/> W pobliżu zatok</label>
          <button className="secondary" disabled={busy} onClick={() => void act({ type: 'event', status: eventStatus, end: eventEnd, nearby: eventNearby }, 'Zaktualizowano sygnał wydarzenia.')}>Przelicz wydarzenie</button>
        </div>
        <div className="control-block"><h3>Stan zatok <span>ZGŁOSZENIE</span></h3>{state.bays.map(bay => <div className="bay-control" key={bay.id}><strong>{bay.name}</strong><button disabled={busy} onClick={() => void act({ type: 'bay', bayId: bay.id, closed: bay.closed, occupancy: occupancyStatus(bay, state.now) === 'unknown' ? 'reported_occupied' : 'unknown' }, 'Zmieniono zgłoszony stan zatoki.')}>{occupancyStatus(bay, state.now) === 'unknown' ? 'Zgłoś zajęcie' : 'Usuń zgłoszenie'}</button><button disabled={busy} onClick={() => void act({ type: 'bay', bayId: bay.id, closed: !bay.closed, occupancy: occupancyStatus(bay, state.now) }, 'Zmieniono dostępność zatoki.')}>{bay.closed ? 'Włącz' : 'Wyłącz'}</button></div>)}</div>
        <div className="control-footer"><button className="text-button" disabled={busy} onClick={() => void act({ type: 'advance', now: Math.min(1260, state.now + 30) }, 'Czas scenariusza przesunięty o 30 minut.')}>+30 min scenariusza</button><button className="text-button reset" disabled={busy} onClick={() => { setSubmitted(null); setActiveBayId(null); setDriverStep('intent'); void act({ type: 'reset' }, 'Scenariusz przywrócony.'); }}>Reset scenariusza</button></div>
      </details>
    </div>}

    {tab === 'sign' && <section className="sign-layout"><button className="back-link sign-back" onClick={() => setTab('city')}>Panel miasta</button><div className="section-heading"><span>WIDOK ULICY / MAKIETA</span><h2>Jedna informacja na każdym ekranie.</h2><p>Cyfrowy podgląd funkcji zatoki. Nie jest zatwierdzonym oznakowaniem drogowym.</p></div><div className="sign-grid">{state.bays.map(bay => { const mode = modeAt(bay, state.now); const next = nextMode(bay, state.now); return <article key={bay.id} className="street-sign"><div className="sign-top"><span>TU WOLNO?</span><b>{bay.id}</b></div><div className={`sign-main ${bay.closed ? 'unknown' : mode ?? 'unknown'}`}><small>{bay.closed ? 'NIEDOSTĘPNA' : 'TERAZ'}</small><strong>{bay.closed ? 'WYŁĄCZONA' : mode ? MODE_LABEL[mode].toUpperCase() : 'BRAK PLANU'}</strong></div><div className="sign-bottom"><span>{next ? `OD ${formatTime(next.start)}` : 'DALEJ'}</span><b>{next ? MODE_LABEL[next.mode].toUpperCase() : 'BRAK ZMIANY'}</b></div></article>; })}</div>{state.lastDecision && <p className="last-decision">Ostatnia decyzja: {state.lastDecision}</p>}<p className="fineprint">Plan w tym widoku pochodzi z demonstracyjnej decyzji operatora. Na prawdziwej ulicy musi odpowiadać zatwierdzonej organizacji ruchu i oznakowaniu.</p></section>}

    <footer><span>TuWolno? · prototyp konkursowy</span><span>Źródła i ograniczenia danych są jawne. Model zatok nie opisuje obecnego oznakowania Warszawy.</span></footer>
  </main>;
}
