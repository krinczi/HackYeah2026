'use client';

import { useEffect, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';
import { availabilityHint, modeAt, type AppState, type Bay, type Match } from '@/lib/core';

type Point = [number, number];
type Props = {
  state: AppState;
  matches: Match[];
  arrival: number;
  selectedBayId: string | null;
  onSelectBay: (id: string) => void;
};

// Illustrative points near Świętokrzyska / Marszałkowska, not surveyed bay coordinates.
// The street context is supported by historical public research; A–C remain demo data.
const DEMO_POINTS: Record<string, Point> = {
  A: [52.23534, 21.00725],
  B: [52.23547, 21.00835],
  C: [52.23561, 21.00945],
};

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
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
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
      map.fitBounds(L.latLngBounds(Object.values(DEMO_POINTS)).pad(0.55), { maxZoom: 17, animate: false });
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
    if (accuracy) L.circle(location, { radius: accuracy, color: '#203126', weight: 1, fillColor: '#438770', fillOpacity: 0.08 }).addTo(layer);
    const pin = document.createElement('span');
    pin.className = 'map-user-pin';
    pin.textContent = 'TY';
    L.marker(location, {
      icon: L.divIcon({ className: 'map-pin-wrapper', html: pin, iconSize: [44, 44], iconAnchor: [22, 22] }),
      title: 'Twoja przybliżona lokalizacja',
      zIndexOffset: 2000,
    }).addTo(layer);
    map.fitBounds(L.latLngBounds([...Object.values(DEMO_POINTS), location]).pad(0.28), { maxZoom: 16 });
    return () => { layer.remove(); };
  }, [ready, location, accuracy]);

  function findMe() {
    if (!navigator.geolocation) {
      setLocationMessage('Ta przeglądarka nie udostępnia lokalizacji.');
      return;
    }
    setLocating(true);
    setLocationMessage('');
    navigator.geolocation.getCurrentPosition(
      position => {
        setLocation([position.coords.latitude, position.coords.longitude]);
        setAccuracy(position.coords.accuracy);
        setLocating(false);
      },
      error => {
        setLocating(false);
        setLocationMessage(error.code === 1 ? 'Lokalizacja nie została udostępniona.' : 'Nie udało się ustalić lokalizacji. Spróbuj ponownie.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  function focusBays() {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (L && map) map.fitBounds(L.latLngBounds(Object.values(DEMO_POINTS)).pad(0.55), { maxZoom: 17 });
  }

  return <section className="bay-map-card" id="mapa-zatok" aria-label="Mapa zatok">
    <div className="bay-map-heading"><div><span>WARSZAWA / SCENARIUSZ</span><h3>Zatoki na mapie</h3></div><span className="bay-map-count">{matches.length} / {state.bays.length} pasuje</span></div>
    <div className="bay-map-actions"><button type="button" onClick={findMe} disabled={locating}>{locating ? 'Ustalam lokalizację…' : location ? 'Odśwież moją lokalizację' : 'Pokaż moją lokalizację'}</button>{location && <button type="button" onClick={focusBays}>Wróć do zatok</button>}</div>
    <div className="bay-map-stage"><div ref={canvasRef} className="bay-map-canvas" aria-label="Mapa OpenStreetMap z modelowymi zatokami A, B i C" />{!ready && !mapError && <div className="bay-map-loading">Ładowanie mapy…</div>}{mapError && <div className="bay-map-loading">Mapa jest chwilowo niedostępna. Lista zatok nadal działa.</div>}</div>
    <div className="bay-map-legend"><span><i className="legend-delivery" />Dostawa</span><span><i className="legend-parking" />Parking</span><span><i className="legend-pickup" />Odbiór</span><span><i className="legend-unavailable" />Nie pasuje</span>{matches.some(match => availabilityHint(state, match.bay, arrival)?.kind === 'possible_free') && <span><i className="legend-possible" />Może być wolne</span>}{location && <span><i className="legend-user" />Twoja pozycja</span>}</div>
    {locationMessage && <p className="bay-map-message" role="status">{locationMessage}</p>}
    {location && accuracy && <p className="bay-map-message">Pozycja przybliżona · dokładność GPS około {Math.round(accuracy)} m.</p>}
    {tilesError && <p className="bay-map-message">Podkład OpenStreetMap jest niedostępny; znaczniki pozostają orientacyjne.</p>}
    <p className="bay-map-disclaimer">A–C to punkty demonstracyjne, nie zweryfikowane zatoki. Ich położenie na mapie jest orientacyjne; odległości na liście są częścią scenariusza.</p>
  </section>;
}
