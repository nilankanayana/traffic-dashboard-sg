export default function TaxiPanel({ data, lastUpdated }) {
  const count = data?.count ?? 0;
  const ts = data?.apiTimestamp ? new Date(data.apiTimestamp) : null;
  const updated = lastUpdated ? lastUpdated.toLocaleTimeString() : '—';

  return (
    <aside className="panel panel--taxis">
      <header className="panel-header">
        <div className="panel-title-group">
          <h2 className="panel-title">Available taxis</h2>
          <span className="panel-id">LIVE</span>
        </div>
      </header>
      <div className="panel-body">
        <div className="taxi-hero">
          <div className="taxi-hero-value">{count.toLocaleString()}</div>
          <div className="taxi-hero-label">taxis available across Singapore</div>
        </div>
        <dl className="panel-meta">
          <dt>Scraped at</dt>
          <dd>{ts ? ts.toLocaleString() : '—'}</dd>
          <dt>Client refresh</dt>
          <dd>{updated}</dd>
          <dt>Source cadence</dt>
          <dd>every 30s (LTA Datamall)</dd>
        </dl>
        <p className="taxi-hint">
          Zoomed out: density heatmap (warmer = more taxis). Zoom in past street level and the map switches to individual taxi pins so you can see exactly where each available cab is right now.
        </p>
      </div>
    </aside>
  );
}
