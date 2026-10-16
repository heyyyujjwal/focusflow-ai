interface DashboardProps {
  total: number;
  active: number;
  completed: number;
  progress: number;
}

export default function Dashboard({ total, active, completed, progress }: DashboardProps) {
  return (
    <section className="dashboard" aria-label="Task statistics">
      <div className="stat-cards">
        <article className="stat-card stat-card--total">
          <span className="stat-card__label">Total Tasks</span>
          <span className="stat-card__value">{total}</span>
        </article>
        <article className="stat-card stat-card--active">
          <span className="stat-card__label">Active</span>
          <span className="stat-card__value">{active}</span>
        </article>
        <article className="stat-card stat-card--completed">
          <span className="stat-card__label">Completed</span>
          <span className="stat-card__value">{completed}</span>
        </article>
      </div>

      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">Overall Progress</span>
          <span className="progress-pct">{progress}%</span>
        </div>
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress}% of tasks completed`}
        >
          <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </section>
  );
}
