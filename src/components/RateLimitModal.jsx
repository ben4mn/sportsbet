export default function RateLimitModal({ isOpen, onClose, retryAfter }) {
  if (!isOpen) return null;

  const formatRetryTime = (seconds) => {
    if (!seconds || seconds < 60) {
      return `${seconds || 60} seconds`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: '1.5rem' }}>
        <div className="modal-icon">⚠️</div>
        <h2 className="modal-title">API Limit Reached</h2>
        <p className="modal-text">
          We've hit the free tier limit for odds data.
          The API quota refreshes monthly.
        </p>
        <p className="modal-subtext">
          Try again in {formatRetryTime(retryAfter)}, or check back later.
        </p>
        <div className="modal-info">
          <p>While waiting, you can:</p>
          <ul>
            <li>View your saved parlays</li>
            <li>Update your preferences</li>
            <li>Check the Research page for team stats</li>
          </ul>
        </div>
        <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
          Got it
        </button>
      </div>
    </div>
  );
}
