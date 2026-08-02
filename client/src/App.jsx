import { useState } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import MapView from './components/MapView.jsx';
import CameraPanel from './components/CameraPanel.jsx';
import Controls from './components/Controls.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import { useCameras } from './hooks/useCameras.js';
import { useTheme } from './hooks/useTheme.js';

const CAMERA_REFRESH_MS = 60_000;

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const cameraQuery = useCameras(CAMERA_REFRESH_MS);
  const [selectedId, setSelectedId] = useState(null);
  const location = useLocation();

  const cameras = cameraQuery.data?.cameras ?? [];
  const selected = cameras.find((c) => c.camera_id === selectedId) ?? null;
  const isDashboard = location.pathname === '/';

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">⌖</span>
          <div className="brand-text">
            <h1 className="brand-title">Singapore Traffic</h1>
            <span className="brand-subtitle">Live LTA traffic cameras</span>
          </div>
        </div>
        <nav className="app-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `app-nav-link${isActive ? ' app-nav-link--active' : ''}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) => `app-nav-link${isActive ? ' app-nav-link--active' : ''}`}
          >
            Projects
          </NavLink>
        </nav>
        <div className="header-actions">
          {isDashboard && (
            <Controls
              onRefresh={cameraQuery.refresh}
              lastUpdated={cameraQuery.lastUpdated}
              loading={cameraQuery.loading}
              error={cameraQuery.error}
              count={cameras.length}
              label="cameras"
              hasData={!!cameraQuery.data}
              stale={cameraQuery.data?.stale}
            />
          )}
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>
      <Routes>
        <Route
          path="/"
          element={
            <main className="app-main">
              <section className="map-card">
                <MapView
                  cameras={cameras}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </section>
              <CameraPanel camera={selected} onClose={() => setSelectedId(null)} />
            </main>
          }
        />
        <Route path="/projects" element={<ProjectsPage />} />
      </Routes>
      <footer className="app-footer">
        <span>
          Data from <a href="https://data.gov.sg" target="_blank" rel="noreferrer">data.gov.sg</a>,
          provided by the Land Transport Authority.
        </span>
        <span>
          Made by Nilanka with <a href="https://claude.com/claude-code" target="_blank" rel="noreferrer">Claude Code</a> — 2026 May
        </span>
      </footer>
    </div>
  );
}
