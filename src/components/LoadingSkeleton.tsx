export function LoadingSkeleton() {
  return (
    <div className="ce-skeleton">
      {/* Profile card skeleton */}
      <div className="ce-skeleton-card">
        <div className="ce-skeleton-avatar ce-skeleton-pulse" />
        <div className="ce-skeleton-lines">
          <div className="ce-skeleton-line ce-skeleton-pulse" style={{ width: "60%" }} />
          <div className="ce-skeleton-line ce-skeleton-pulse" style={{ width: "40%" }} />
          <div className="ce-skeleton-line ce-skeleton-pulse" style={{ width: "80%" }} />
        </div>
      </div>
      {/* Map skeleton */}
      <div
        className="ce-skeleton-map ce-skeleton-pulse"
        style={{ height: 300 }}
      />
      {/* Stats skeleton */}
      <div className="ce-skeleton-stats">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="ce-skeleton-stat ce-skeleton-pulse" />
        ))}
      </div>
    </div>
  );
}
