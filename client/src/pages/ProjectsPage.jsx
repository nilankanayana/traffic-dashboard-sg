import { Link } from 'react-router-dom';

const PROJECTS = [
  {
    id: 'traffic',
    name: 'Singapore Traffic',
    description: 'Live LTA traffic cameras across expressways and checkpoints.',
    routerTo: '/',
  },
  {
    id: 'carpark',
    name: 'HDB Carpark Availability',
    description: 'Real-time carpark lot availability across HDB estates.',
    href: import.meta.env.VITE_PROJECT_URL_CARPARK || null,
  },
  {
    id: 'rental',
    name: 'HDB Rental Prices',
    description: 'Median rental price trends by town and flat type.',
    href: import.meta.env.VITE_PROJECT_URL_RENTAL || null,
  },
];

export default function ProjectsPage() {
  return (
    <main className="projects-page">
      <div className="projects-header">
        <h2 className="projects-title">Singapore Open Data</h2>
        <p className="projects-subtitle">
          Live dashboards built on public APIs from data.gov.sg.
        </p>
      </div>
      <div className="projects-grid">
        {PROJECTS.map((p) => {
          const available = !!(p.routerTo || p.href);
          const card = (
            <div className={`project-card${!available ? ' project-card--coming-soon' : ''}`}>
              <div className="project-card-body">
                <h3 className="project-card-name">{p.name}</h3>
                <p className="project-card-desc">{p.description}</p>
              </div>
              {available ? (
                <span className="project-card-cta">Open &rarr;</span>
              ) : (
                <span className="project-card-badge">Coming soon</span>
              )}
            </div>
          );

          if (p.routerTo) {
            return (
              <Link key={p.id} to={p.routerTo} className="project-card-link">
                {card}
              </Link>
            );
          }
          if (p.href) {
            return (
              <a key={p.id} href={p.href} target="_blank" rel="noreferrer" className="project-card-link">
                {card}
              </a>
            );
          }
          return <div key={p.id}>{card}</div>;
        })}
      </div>
    </main>
  );
}
