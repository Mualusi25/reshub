import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="empty" style={{ padding: '100px 20px' }}>
      <h1>Page not found</h1>
      <p style={{ margin: '10px 0 20px' }}>The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  )
}
