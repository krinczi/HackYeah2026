'use client';

import { useEffect, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';
import { availabilityHint, DEMO_BAY_POINTS, modeAt, type AppState, type Bay, type Match } from '@/lib/core';

type Point = [number, number];
type Props = {
  state: AppState;
  matches: Match[];
  arrival: number;
  selectedBayId: string | null;
  onSelectBay: (id: string) => void;
};

const DEMO_POINTS: Record<string, Point> = Object.fromEntries(Object.entries(DEMO_BAY_POINTS).map(([id, point]) => [id, [point.lat, point.lng]]));
const DEMO_START: Point = [52.235700, 21.010870];

function bayIcon(L: typeof Leaflet, bay: Bay, eligible: boolean, selected: boolean, possibleFree: boolean, arrival: number) {
  const marker = document.createElement('span');
  const mode = modeAt(bay, arrival);
  marker.className = `map-bay-pin ${mode ?? 'unknown'} ${eligible ? 'is-match' : 'is-unavailable'} ${selected ? 'is-selected' : ''} ${possibleFree ? 'is-possible-free' : ''}`;
  marker.textContent = bay.id;
  return L.divIcon({ className: 'map-pin-wrapper', html: marker, iconSize: [44, 50], iconAnchor: [22, 49], popupAnchor: [0, -44] });
}

export default function BayMap({ state, matches, arrival, selectedBayId, onSelectBay }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [tilesError, setTilesError] = useState(false);
  const [location, setLocation] = useState<Point | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    void import('leaflet').then(L => {
      if (!mounted || !canvasRef.current) return;
      const map = L.map(canvasRef.current, { zoomControl: false, scrollWheelZoom: false });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
      }).on('tileerror', () => setTilesError(true)).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      map.fitBounds(L.latLngBounds(Object.values(DEMO_POINTS)).pad(0.45), { maxZoom: 18, animate: false });
      leafletRef.current = L;
      mapRef.current = map;
      setReady(true);
      requestAnimationFrame(() => map.invalidateSize());
    }).catch(() => { if (mounted) setMapError(true); });
    return () => {
      mounted = false;
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;
    const layer = L.layerGroup().addTo(map);
    for (const bay of state.bays) {
      const point = DEMO_POINTS[bay.id];
      if (!point) continue;
      const eligible = matches.some(match => match.bay.id === bay.id);
      const hint = availabilityHint(state, bay, arrival);
      const marker = L.marker(point, {
        icon: bayIcon(L, bay, eligible, selectedBayId === bay.id, eligible && hint?.kind === 'possible_free', arrival),
        title: `${bay.name}: ${eligible ? 'pasuje do postoju' : 'nie pasuje do wybranego postoju'}`,
        zIndexOffset: selectedBayId === bay.id ? 1000 : 0,
      }).addTo(layer);
      const popup = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = bay.name;
      const status = document.createElement('span');
      status.textContent = eligible && hint?.kind === 'possible_free' ? 'Może być wolne' : hint?.kind === 'expected_occupied' ? 'Przewidywany postój' : eligible ? 'Pasuje do wybranego postoju' : 'Nie pasuje do wybranych warunków';
      const note = document.createElement('small');
      note.textContent = eligible && hint?.kind === 'possible_free' || hint?.kind === 'expected_occupied' ? hint.detail : 'Punkt modelowy · dokładne położenie niepotwierdzone';
      popup.className = 'bay-map-popup';
      popup.append(title, status, note);
      marker.bindPopup(popup);
      marker.on('click', () => onSelectBay(bay.id));
      if (selectedBayId === bay.id) marker.openPopup();
    }
    return () => { layer.remove(); };
  }, [ready, state, matches, arrival, selectedBayId, onSelectBay]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map || !location) return;
    const layer = L.layerGroup().addTo(map);
    const pin = document.createElement('span');
    pin.className = 'map-user-pin';
    pin.textContent = 'START';
    L.marker(location, {
      icon: L.divIcon({ className: 'map-pin-wrapper', html: pin, iconSize: [52, 44], iconAnchor: [26, 22] }),
      title: 'Punkt startowy scenariusza · pozycja symulowana',
      zIndexOffset: 2000,
    }).addTo(layer);
    map.fitBounds(L.latLngBounds([...Object.values(DEMO_POINTS), location]).pad(0.35), { maxZoom: 18 });
    return () => { layer.remove(); };
  }, [ready, location]);

  function findMe() {
    setShowLocationPrompt(true);
  }

  function focusBays() {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (L && map) map.fitBounds(L.latLngBounds(Object.values(DEMO_POINTS)).pad(0.45), { maxZoom: 18 });
  }

  return <section className="bay-map-card" id="mapa-zatok" aria-label="Mapa zatok">
    <div className="bay-map-heading"><div><span>ŚWIĘTOKRZYSKA / WARSZAWA</span><h3>Jedna ulica, różne potrzeby</h3></div><span className="bay-map-count">{matches.length} / {state.bays.length} pasuje</span></div>
    <p className="bay-map-street">Marszałkowska → pl. Powstańców Warszawy</p>
    <div className="bay-map-actions"><button type="button" onClick={findMe}>{location ? 'Zmień punkt startowy' : 'Ustaw punkt startowy'}</button>{location && <button type="button" onClick={focusBays}>Wróć do zatok</button>}</div>
    {showLocationPrompt && <div className="location-prompt" role="group" aria-label="Pozycja demonstracyjna"><strong>Pokazać Cię na tej ulicy?</strong><p>Na potrzeby demo ustawimy punkt startowy przy Świętokrzyskiej. To symulacja; nie pytamy przeglądarki o GPS.</p><div><button type="button" onClick={() => { setLocation(DEMO_START); setLocationMessage('Punkt startowy ustawiony w scenariuszu · pozycja symulowana.'); setShowLocationPrompt(false); }}>Tak, pokaż</button><button type="button" onClick={() => setShowLocationPrompt(false)}>Nie teraz</button></div></div>}
    <div className="bay-map-stage"><div ref={canvasRef} className="bay-map-canvas" aria-label="Mapa OpenStreetMap z modelowymi zatokami A, B i C" />{!ready && !mapError && <div className="bay-map-loading">Ładowanie mapy…</div>}{mapError && <div className="bay-map-loading">Mapa jest chwilowo niedostępna. Lista zatok nadal działa.</div>}</div>
    <div className="bay-map-legend"><span><i className="legend-delivery" />Dostawa</span><span><i className="legend-parking" />Parking</span><span><i className="legend-pickup" />Odbiór</span><span><i className="legend-unavailable" />Nie pasuje</span>{matches.some(match => availabilityHint(state, match.bay, arrival)?.kind === 'possible_free') && <span><i className="legend-possible" />Może być wolne</span>}{location && <span><i className="legend-user" />Start demo</span>}</div>
    {locationMessage && <p className="bay-map-message" role="status">{locationMessage}</p>}
    {tilesError && <p className="bay-map-message">Podkład OpenStreetMap jest niedostępny; znaczniki pozostają orientacyjne.</p>}
    <p className="bay-map-disclaimer">Ulica jest prawdziwa. A–C to punkty scenariusza, nie zweryfikowane zatoki; zasady i odległości są demonstracyjne.</p>
  </section>;
}
