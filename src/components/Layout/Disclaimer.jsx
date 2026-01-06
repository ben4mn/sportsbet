import { useState, useEffect } from 'react';

export default function Disclaimer() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('disclaimer_accepted');
    if (!accepted) {
      setShow(true);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem('disclaimer_accepted', 'true');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-header">
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 1rem',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg style={{ width: '32px', height: '32px', color: 'var(--warning)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2>Important Disclaimer</h2>
        </div>

        <div className="modal-body">
          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            This tool is for <strong style={{ color: 'var(--text-primary)' }}>RESEARCH and ENTERTAINMENT purposes only</strong>.
          </p>

          <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>We do NOT place bets or handle any money</li>
            <li style={{ marginBottom: '0.5rem' }}>All odds shown are ESTIMATES and may differ from actual sportsbook odds</li>
            <li style={{ marginBottom: '0.5rem' }}>Past performance does not guarantee future results</li>
            <li>This is NOT financial or betting advice</li>
          </ul>

          <div style={{
            background: 'var(--bg-base)',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem',
            marginBottom: '1rem'
          }}>
            <p style={{ color: 'var(--warning)', fontWeight: 500, marginBottom: '0.25rem' }}>Age Requirement</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>You must be 21 years or older to use this application.</p>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            If you or someone you know has a gambling problem, call{' '}
            <span style={{ color: 'var(--primary)' }}>1-800-GAMBLER</span>.
          </p>
        </div>

        <div className="modal-footer">
          <button onClick={handleAccept} className="btn btn-primary btn-block">
            I understand and am 21 or older
          </button>
        </div>
      </div>
    </div>
  );
}
