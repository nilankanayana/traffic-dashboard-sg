export default function CameraPanel({ camera, onClose }) {
  if (!camera) {
    return (
      <aside className="panel panel--empty">
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">📷</span>
          <p className="empty-title">No camera selected</p>
          <p className="empty-text">Click any marker on the map to view its live traffic image.</p>
        </div>
      </aside>
    );
  }

  const ts = camera.timestamp ? new Date(camera.timestamp) : null;
  const { latitude, longitude } = camera.location ?? {};
  const meta = camera.image_metadata;

  return (
    <aside className="panel">
      <header className="panel-header">
        <div className="panel-title-group">
          <h2 className="panel-title">Live feed</h2>
          <span className="panel-id">#{camera.camera_id}</span>
        </div>
        <button type="button" className="panel-close" onClick={onClose} aria-label="Close panel">
          &times;
        </button>
      </header>
      <div className="panel-body">
        <img
          className="panel-image"
          src={camera.image}
          alt={`Traffic camera ${camera.camera_id}`}
        />
        <dl className="panel-meta">
          <dt>Captured</dt>
          <dd>{ts ? ts.toLocaleString() : '—'}</dd>
          <dt>Location</dt>
          <dd>
            {latitude != null && longitude != null
              ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
              : '—'}
          </dd>
          {meta && (
            <>
              <dt>Resolution</dt>
              <dd>{meta.width} × {meta.height} px</dd>
            </>
          )}
        </dl>
      </div>
    </aside>
  );
}
