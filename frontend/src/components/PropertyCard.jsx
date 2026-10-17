import { Link } from 'react-router-dom'
import { MapPin, Star, Heart, Building2 } from 'lucide-react'
import { STATUS_LABELS } from '../data/listings'
import { useSaved } from '../context/SavedContext'
import useStudentGuard from '../hooks/useStudentGuard'

export default function PropertyCard({ p }) {
  const { ids, toggle } = useSaved()
  const requireStudent = useStudentGuard()
  const saved = ids.has(p.id)
  const to = `/accommodation/${p.id}`

  return (
    <article className="card">
      <Link to={to} className="card-img" aria-label={`View ${p.name}`}>
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} loading="lazy" />
        ) : (
          <Building2 size={56} strokeWidth={1.4} />
        )}
      </Link>
      <div className="card-body">
        <span className={`badge ${p.status}`}>{STATUS_LABELS[p.status]}</span>
        <h3>
          <Link to={to}>{p.name}</Link>
        </h3>
        <div className="price">
          R{p.price.toLocaleString('en-ZA')} <small>/ month</small>
        </div>
        <div className="meta">
          <MapPin size={14} /> {p.distance} km from campus · {p.area}
        </div>
        <div className="meta rating">
          <Star size={14} fill="currentColor" />
          {p.reviews > 0 ? `${p.rating} (${p.reviews})` : 'No reviews yet'}
        </div>
        <div className="card-actions">
          <Link to={to} className="btn btn-primary">View Details</Link>
          <button
            className={`save-btn ${saved ? 'saved' : ''}`}
            aria-label={saved ? `Remove ${p.name} from saved` : `Save ${p.name}`}
            aria-pressed={saved}
            onClick={() => requireStudent('save listings') && toggle(p.id)}
          >
            <Heart size={22} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  )
}
