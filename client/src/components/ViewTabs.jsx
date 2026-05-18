const TABS = [
  { id: 'cameras', label: 'Cameras', icon: '📷' },
  { id: 'taxis', label: 'Taxis', icon: '🚕' },
];

export default function ViewTabs({ view, onChange }) {
  return (
    <div className="view-tabs" role="tablist" aria-label="Data view">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={view === tab.id}
          className={`view-tab${view === tab.id ? ' view-tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="view-tab-icon" aria-hidden="true">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
