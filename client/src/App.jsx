import { useState } from 'react';
import MapView from './components/MapView.jsx';
import CameraPanel from './components/CameraPanel.jsx';
import TaxiPanel from './components/TaxiPanel.jsx';
import Controls from './components/Controls.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import ViewTabs from './components/ViewTabs.jsx';
import { useCameras } from './hooks/useCameras.js';
import { useTaxis } from './hooks/useTaxis.js';
import { useTheme } from './hooks/useTheme.js';

const CAMERA_REFRESH_MS = 60_000;
const TAXI_REFRESH_MS = 60_000;

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [view, setView] = useState('cameras');
  const cameraQuery = useCameras(CAMERA_REFRESH_MS);
  const taxiQuery = useTaxis(TAXI_REFRESH_MS);
  const [selectedId, setSelectedId] = useState(null);

  const cameras = cameraQuery.data?.cameras ?? [];
  const taxiPoints = taxiQuery.data?.coordinates ?? [];
  const selected = cameras.find((c) => c.camera_id === selectedId) ?? null;

  const active = view === 'cameras' ? cameraQuery : taxiQuery;
  const activeCount = view === 'cameras' ? cameras.length : (taxiQuery.data?.count ?? 0);

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">⌖</span>
          <div className="brand-text">
            <h1 className="brand-title">Singapore Traffic</h1>
            <span className="brand-subtitle">Live LTA feeds · cameras + taxis</span>
          </div>
        </div>
        <div className="header-actions">
          <Controls
            onRefresh={active.refresh}
            lastUpdated={active.lastUpdated}
            loading={active.loading}
            error={active.error}
            count={activeCount}
            label={view === 'cameras' ? 'cameras' : 'taxis'}
            hasData={!!active.data}
            stale={active.data?.stale}
          />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>
      <main className="app-main">
        <section className="map-card">
          <ViewTabs view={view} onChange={setView} />
          <MapView
            view={view}
            cameras={cameras}
            taxiPoints={taxiPoints}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </section>
        {view === 'cameras' ? (
          <CameraPanel camera={selected} onClose={() => setSelectedId(null)} />
        ) : (
          <TaxiPanel data={taxiQuery.data} lastUpdated={taxiQuery.lastUpdated} />
        )}
      </main>
      <footer className="app-footer">
        Data from <a href="https://data.gov.sg" target="_blank" rel="noreferrer">data.gov.sg</a>,
        provided by the Land Transport Authority.
      </footer>
    </div>
  );
}
