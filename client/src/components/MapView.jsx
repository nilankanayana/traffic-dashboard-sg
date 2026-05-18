import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

const DEFAULT_CENTER = [1.3521, 103.8198];
const DEFAULT_ZOOM = 11;

// Below this zoom: heatmap. At/above: individual taxi dots.
const TAXI_DOT_ZOOM = 14;

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

const taxiIcon = L.divIcon({
  className: 'taxi-marker',
  html: '<span class="taxi-marker-emoji" aria-hidden="true">🚕</span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function syncLayer(map, layer, shouldShow) {
  if (!layer) return;
  const has = map.hasLayer(layer);
  if (shouldShow && !has) layer.addTo(map);
  if (!shouldShow && has) map.removeLayer(layer);
}

export default function MapView({ view, cameras, taxiPoints, selectedId, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const cameraLayerRef = useRef(null);
  const heatLayerRef = useRef(null);
  const dotLayerRef = useRef(null);
  const markersRef = useRef(new Map());
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

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

    cameraLayerRef.current = L.layerGroup();
    dotLayerRef.current = L.layerGroup();

    map.on('zoomend', () => setZoom(map.getZoom()));

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      cameraLayerRef.current = null;
      heatLayerRef.current = null;
      dotLayerRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Decide which layer is visible based on the active view + current zoom.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const showCam = view === 'cameras';
    const showHeat = view === 'taxis' && zoom < TAXI_DOT_ZOOM;
    const showDots = view === 'taxis' && zoom >= TAXI_DOT_ZOOM;
    syncLayer(map, cameraLayerRef.current, showCam);
    syncLayer(map, heatLayerRef.current, showHeat);
    syncLayer(map, dotLayerRef.current, showDots);
  }, [view, zoom]);

  // Manage camera markers inside the camera layer group
  useEffect(() => {
    const layer = cameraLayerRef.current;
    if (!layer) return;
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
        marker.addTo(layer);
        existing.set(camera_id, marker);
      } else {
        marker.setLatLng([location.latitude, location.longitude]);
      }
    }

    for (const [id, marker] of existing) {
      if (!seen.has(id)) {
        layer.removeLayer(marker);
        existing.delete(id);
      }
    }
  }, [cameras, onSelect]);

  // Update camera marker selection state
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      marker.setIcon(id === selectedId ? selectedIcon : defaultIcon);
    }
  }, [selectedId]);

  // (Re)build the taxi heat layer when point data, view, or zoom changes.
  // leaflet.heat throws if setLatLngs is called while the layer is detached,
  // so we only push updates when the layer is currently on the map. The
  // view/zoom deps mean fresh data flushes in as soon as the layer becomes
  // visible (the visibility effect above runs first in declaration order).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const latLngs = (taxiPoints || []).map(([lng, lat]) => [lat, lng, 0.6]);

    if (!heatLayerRef.current) {
      heatLayerRef.current = L.heatLayer(latLngs, {
        radius: 18,
        blur: 22,
        maxZoom: 17,
        minOpacity: 0.35,
        gradient: { 0.2: '#3b82f6', 0.4: '#22d3ee', 0.6: '#facc15', 0.8: '#fb923c', 1.0: '#ef4444' },
      });
    } else if (map.hasLayer(heatLayerRef.current)) {
      heatLayerRef.current.setLatLngs(latLngs);
    }
  }, [taxiPoints, view, zoom]);

  // Rebuild the taxi pin layer when the point data changes. Markers are
  // non-interactive (purely visual) so we skip click/keyboard handlers.
  useEffect(() => {
    const layer = dotLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!taxiPoints?.length) return;
    for (const [lng, lat] of taxiPoints) {
      L.marker([lat, lng], {
        icon: taxiIcon,
        interactive: false,
        keyboard: false,
      }).addTo(layer);
    }
  }, [taxiPoints]);

  return <div ref={containerRef} className="map" />;
}
