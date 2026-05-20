import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [1.3521, 103.8198];
const DEFAULT_ZOOM = 11;
const NEAR_ME_ZOOM = 14;

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const LOCATE_ICON_SVG =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/>' +
  '<line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>' +
  '<line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>' +
  '</svg>';

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

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<span class="user-location-pulse"></span><span class="user-location-dot"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export default function MapView({ cameras, selectedId, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const cameraLayerRef = useRef(null);
  const markersRef = useRef(new Map());
  const userMarkerRef = useRef(null);
  const [locationError, setLocationError] = useState(null);

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

    cameraLayerRef.current = L.layerGroup().addTo(map);

    const MapActionsControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd() {
        const el = L.DomUtil.create('div', 'leaflet-bar leaflet-control map-actions-control');

        const home = L.DomUtil.create('a', 'map-action-home', el);
        home.href = '#';
        home.setAttribute('role', 'button');
        home.title = 'Reset view';
        home.setAttribute('aria-label', 'Reset map to Singapore overview');
        home.innerHTML = '⌂';

        const nearMe = L.DomUtil.create('a', 'map-action-nearme', el);
        nearMe.href = '#';
        nearMe.setAttribute('role', 'button');
        nearMe.title = 'Show my location';
        nearMe.setAttribute('aria-label', 'Show my location and zoom to nearby area');
        nearMe.innerHTML = LOCATE_ICON_SVG;

        L.DomEvent.disableClickPropagation(el);
        L.DomEvent.on(home, 'click', (e) => {
          L.DomEvent.preventDefault(e);
          map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.6 });
        });
        L.DomEvent.on(nearMe, 'click', (e) => {
          L.DomEvent.preventDefault(e);
          if (nearMe.classList.contains('is-loading')) return;
          if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser.');
            return;
          }
          nearMe.classList.add('is-loading');
          setLocationError(null);
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const latlng = [pos.coords.latitude, pos.coords.longitude];
              if (userMarkerRef.current) {
                userMarkerRef.current.setLatLng(latlng);
              } else {
                userMarkerRef.current = L.marker(latlng, {
                  icon: userLocationIcon,
                  interactive: false,
                  keyboard: false,
                  zIndexOffset: 1000,
                }).addTo(map);
              }
              map.flyTo(latlng, NEAR_ME_ZOOM, { duration: 0.8 });
              nearMe.classList.remove('is-loading');
            },
            (err) => {
              let msg = 'Unable to get your location.';
              if (err.code === err.PERMISSION_DENIED) msg = 'Location permission denied.';
              else if (err.code === err.POSITION_UNAVAILABLE) msg = 'Location is currently unavailable.';
              else if (err.code === err.TIMEOUT) msg = 'Location request timed out.';
              setLocationError(msg);
              nearMe.classList.remove('is-loading');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
          );
        });
        return el;
      },
    });
    new MapActionsControl().addTo(map);

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      cameraLayerRef.current = null;
      markersRef.current.clear();
      userMarkerRef.current = null;
    };
  }, []);

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

  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      marker.setIcon(id === selectedId ? selectedIcon : defaultIcon);
    }
  }, [selectedId]);

  return (
    <div className="map-wrap">
      <div ref={containerRef} className="map" />
      {locationError && (
        <div className="map-toast" role="alert">
          <span>{locationError}</span>
          <button
            type="button"
            className="map-toast-close"
            onClick={() => setLocationError(null)}
            aria-label="Dismiss location error"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
