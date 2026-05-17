import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [1.3521, 103.8198];
const DEFAULT_ZOOM = 11;

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function makeIcon(selected) {
  return L.divIcon({
    className: `camera-marker${selected ? ' camera-marker--selected' : ''}`,
    html: '<span class="camera-marker-dot"></span>',
    iconSize: selected ? [28, 28] : [20, 20],
    iconAnchor: selected ? [14, 14] : [10, 10],
  });
}

const defaultIcon = makeIcon(false);
const selectedIcon = makeIcon(true);

export default function MapView({ cameras, selectedId, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    L.tileLayer(TILE_URL, {
      maxZoom: 19,
      attribution: TILE_ATTRIBUTION,
      subdomains: 'abcd',
    }).addTo(map);
    mapRef.current = map;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const existing = markersRef.current;
    const seen = new Set();

    for (const cam of cameras) {
      if (!cam.location) continue;
      const { camera_id, location } = cam;
      seen.add(camera_id);
      let marker = existing.get(camera_id);
      if (!marker) {
        marker = L.marker([location.latitude, location.longitude], { icon: defaultIcon });
        marker.on('click', () => onSelect(camera_id));
        marker.bindTooltip(`Camera ${camera_id}`, { direction: 'top', offset: [0, -8] });
        marker.addTo(map);
        existing.set(camera_id, marker);
      } else {
        marker.setLatLng([location.latitude, location.longitude]);
      }
    }

    for (const [id, marker] of existing) {
      if (!seen.has(id)) {
        map.removeLayer(marker);
        existing.delete(id);
      }
    }
  }, [cameras, onSelect]);

  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      marker.setIcon(id === selectedId ? selectedIcon : defaultIcon);
    }
  }, [selectedId]);

  return <div ref={containerRef} className="map" />;
}
