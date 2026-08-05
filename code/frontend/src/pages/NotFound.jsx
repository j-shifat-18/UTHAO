import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div className="eyebrow">404</div>
      <h1>This parcel took a wrong turn.</h1>
      <p style={{ color: 'var(--ink-muted)' }}>We couldn't find the page you're looking for.</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 12 }}>Back to dashboard</Link>
    </div>
  )
}
