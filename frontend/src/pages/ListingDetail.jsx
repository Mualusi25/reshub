import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  MapPin, Star, Heart, GraduationCap, ShieldCheck, ArrowLeft, Clock, Camera,
} from 'lucide-react'
import api, { errMsg } from '../api'
import { STATUS_LABELS } from '../data/listings'
import { useSaved } from '../context/SavedContext'
import useStudentGuard from '../hooks/useStudentGuard'
import EnquiryModal from '../components/EnquiryModal'
import Gallery from '../components/Gallery'

export default function ListingDetail() {
  const { id } = useParams()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const { ids, toggle } = useSaved()
  const requireStudent = useStudentGuard()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    api
      .get(`/listings/${id}`)
      .then(({ data }) => !cancelled && setListing(data.listing))
      .catch((err) => !cancelled && setError(err.response?.status === 404 ? 'not-found' : errMsg(err)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <div className="loading">Loading…</div>

  if (error || !listing) {
    const notFound = error === 'not-found'
    return (
      <div className="empty" style={{ padding: '100px 20px' }}>
        <h1>{notFound ? 'Property not found' : 'Something went wrong'}</h1>
        <p style={{ margin: '10px 0 20px' }}>
          {notFound ? 'It may have been removed or is still awaiting review.' : error}
        </p>
        <Link to="/accommodation" className="btn btn-primary">Browse Accommodation</Link>
      </div>
    )
  }

  const saved = ids.has(listing.id)
  const booked = listing.status === 'booked'
  const canRequest = listing.isVerified && !booked
  const photos = listing.images?.length
    ? listing.images
    : listing.imageUrl
      ? [listing.imageUrl]
      : []

  return (
    <section className="section alt">
      <div className="container">
        <Link to="/accommodation" className="back-link">
          <ArrowLeft size={16} /> Back to all properties
        </Link>

        {!listing.isVerified && (
          <div className="notice">
            <Clock size={16} /> This listing is awaiting admin review. Only you and administrators can see it.
          </div>
        )}

        <div className="detail">
          <div>
            <Gallery images={photos} alt={listing.name} />

            <h1 className="detail-title">{listing.name}</h1>
            <div className="meta">
              <MapPin size={15} /> {listing.area} · {listing.distance} km from campus
            </div>
            <div className="meta">
              <GraduationCap size={15} /> {listing.campus}
            </div>
            <div className="meta rating">
              <Star size={15} fill="currentColor" />
              {listing.reviews > 0 ? `${listing.rating} (${listing.reviews} reviews)` : 'No reviews yet'}
            </div>
            {photos.length > 0 && (
              <div className="meta">
                <Camera size={15} /> {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
              </div>
            )}

            <h2 className="detail-h">About this property</h2>
            <p className="detail-text">
              {listing.description || 'The provider has not added a description yet.'}
            </p>
          </div>

          <aside className="detail-card">
            <span className={`badge ${listing.status}`}>{STATUS_LABELS[listing.status]}</span>
            <div className="price" style={{ fontSize: 30 }}>
              R{listing.price.toLocaleString('en-ZA')} <small>/ month</small>
            </div>

            <div className="detail-buttons">
              <button
                className="btn btn-primary btn-block"
                disabled={!canRequest}
                onClick={() => requireStudent('request a viewing') && setOpen(true)}
              >
                {booked ? 'Fully booked' : 'Request a viewing'}
              </button>
              <button
                className="btn btn-outline btn-block"
                aria-pressed={saved}
                onClick={() => requireStudent('save listings') && toggle(listing.id)}
              >
                <Heart size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save for later'}
              </button>
            </div>

            <ul className="trust">
              <li className={listing.isVerified ? 'ok' : ''}>
                <ShieldCheck size={16} /> {listing.isVerified ? 'Verified listing' : 'Listing not yet verified'}
              </li>
              <li className={listing.providerVerified ? 'ok' : ''}>
                <ShieldCheck size={16} />
                {listing.providerName || 'Provider'}
                {listing.providerVerified ? ' · Verified provider' : ' · Not yet verified'}
              </li>
            </ul>
          </aside>
        </div>
      </div>

      {open && <EnquiryModal listing={listing} onClose={() => setOpen(false)} />}
    </section>
  )
}
