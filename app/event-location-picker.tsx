'use client';

import { useEffect, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';
import { DEMO_BAY_POINTS, EVENT_REACH_METERS, nearestDemoBay, type GeoPoint } from '@/lib/core';

type Props = { value: GeoPoint | null; onChange: (point: GeoPoint) => void };

export default function EventLocationPicker({ value, onChange }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const onChangeRef = useRef(onChange);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [message, setMessage] = useState('');
  onChangeRef.current = onChange;

  useEffect(() => {
    let mounted = true;
    void import('leaflet').then(L => {
      if (!mounted || !canvasRef.current) return;
      const map = L.map(canvasRef.current, { scrollWheelZoom: false });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
      }).on('tileerror', () => setMessage('Podkład mapy jest niedostępny. Możesz wybrać punkt orientacyjny A, B lub C.')).addTo(map);
      for (const [id, point] of Object.entries(DEMO_BAY_POINTS)) {
        L.marker([point.lat, point.lng], {
          icon: L.divIcon({ className: 'event-map-bay', html: id, iconSize: [29, 29], iconAnchor: [14, 14] }),
          title: `Modelowa zatoka ${id}`,
        }).addTo(map);
      }
      map.fitBounds(L.latLngBounds(Object.values(DEMO_BAY_POINTS).map(point => [point.lat, point.lng] as [number, number])).pad(0.6), { maxZoom: 17, animate: false });
      map.on('click', event => {
        const point = { lat: event.latlng.lat, lng: event.latlng.lng };
        const nearest = nearestDemoBay(point);
        if (nearest.distance > EVENT_REACH_METERS) {
          setMessage(`Ten punkt jest poza obszarem pilotażu. Wybierz miejsce do ${EVENT_REACH_METERS} m od modelowej zatoki.`);
          return;
        }
        setMessage('');
        onChangeRef.current(point);
      });
      mapRef.current = map;
      leafletRef.current = L;
      setReady(true);
      requestAnimationFrame(() => map.invalidateSize());
    }).catch(() => { if (mounted) setMapError(true); });
    return () => { mounted = false; mapRef.current?.remove(); mapRef.current = null; leafletRef.current = null; };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map || !value) return;
    const marker = L.marker([value.lat, value.lng], {
      icon: L.divIcon({ className: 'event-map-selected', html: '●', iconSize: [35, 35], iconAnchor: [17, 17] }),
      title: 'Wybrane miejsce wydarzenia',
      zIndexOffset: 1000,
    }).addTo(map);
    return () => { marker.remove(); };
  }, [ready, value]);

  const nearest = value ? nearestDemoBay(value) : null;
  return <div className="event-location-picker">
    <div className="event-location-title"><strong>Miejsce na mapie</strong><span>{value ? 'Punkt wybrany' : 'Kliknij punkt'}</span></div>
    <div className="event-map-stage"><div className="event-map-canvas" ref={canvasRef} aria-label="Mapa wyboru miejsca wydarzenia przy Świętokrzyskiej" />{!ready && !mapError && <div className="event-map-loading">Ładowanie mapy…</div>}{mapError && <div className="event-map-loading">Mapa jest niedostępna. Wybierz punkt orientacyjny poniżej.</div>}</div>
    <div className="event-location-bottom"><p role="status">{message || (nearest ? `Najbliższa modelowa zatoka: ${nearest.id} · ${nearest.distance} m w linii prostej.` : 'Kliknij miejsce wydarzenia na mapie albo wybierz punkt orientacyjny.')}</p><div aria-label="Punkty orientacyjne">{Object.entries(DEMO_BAY_POINTS).map(([id, point]) => <button type="button" key={id} onClick={() => { setMessage(''); onChange(point); }}>Punkt {id}</button>)}</div></div>
  </div>;
}
