import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, MapPin, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { errMsg } from '../api'
import ListingFormModal from '../components/ListingFormModal'
import { STATUS_LABELS } from '../data/listings'

export default function ProviderListings() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | a listing object

  useEffect(() => {
    api
      .get('/listings/mine')
      .then(({ data }) => setItems(data.listings))
      .catch((err) => toast.error(errMsg(err, 'Could not load your listings.')))
      .finally(() => setLoading(false))
  }, [])

  const replace = (listing) =>
    setItems((list) => list.map((l) => (l.id === listing.id ? listing : l)))

  const onSaved = (listing) => {
    if (modal === 'new') setItems((list) => [listing, ...list])
    else replace(listing)
    setModal(null)
  }

  const changeStatus = async (listing, status) => {
    try {
      const { data } = await api.put(`/listings/${listing.id}`, { status })
      replace(data.listing)
      toast.success(`Marked as ${STATUS_LABELS[status]}`)
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const remove = async (listing) => {
    const ok = window.confirm(
      `Delete "${listing.name}"?\n\nThis also removes its saved entries and student enquiries.`
    )
    if (!ok) return
    try {
      await api.delete(`/listings/${listing.id}`)
      setItems((list) => list.filter((l) => l.id !== listing.id))
      toast.success('Listing deleted')
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>My Listings</h1>
          <p>Add and manage the properties students can find on ResHub.</p>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="page-actions">
            <span className="result-count" style={{ margin: 0 }}>
              {items.length} {items.length === 1 ? 'listing' : 'listings'}
            </span>
            <button className="btn btn-primary" onClick={() => setModal('new')}>
              <Plus size={16} /> Add listing
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading…</div>
          ) : items.length === 0 ? (
            <div className="empty">
              <h3>No listings yet</h3>
              <p style={{ margin: '8px 0 18px' }}>Add your first property to start receiving enquiries.</p>
              <button className="btn btn-primary" onClick={() => setModal('new')}>
                <Plus size={16} /> Add listing
              </button>
            </div>
          ) : (
            <div className="list">
              {items.map((l) => (
                <article className="item" key={l.id}>
                  <div className="listing-row">
                    <div className="thumb">
                      {l.imageUrl ? <img src={l.imageUrl} alt={l.name} /> : <Building2 size={30} strokeWidth={1.4} />}
                    </div>

                    <div className="listing-info">
                      <h3>
                        <Link to={`/accommodation/${l.id}`}>{l.name}</Link>{' '}
                        <span className={`badge ${l.isVerified ? 'approved' : 'pending'}`} style={{ marginBottom: 0 }}>
                          {l.isVerified ? 'Verified' : 'Pending review'}
                        </span>
                      </h3>
                      <div className="price" style={{ fontSize: 17, marginBottom: 4 }}>
                        R{l.price.toLocaleString('en-ZA')} <small>/ month</small>
                      </div>
                      <div className="meta">
                        <MapPin size={14} /> {l.area} · {l.distance} km from campus
                      </div>
                      <div className="meta">{l.campus}</div>
                    </div>

                    <div className="listing-controls">
                      <label className="sr-only" htmlFor={`status-${l.id}`}>Availability</label>
                      <select
                        id={`status-${l.id}`}
                        className="status-select"
                        value={l.status}
                        onChange={(e) => changeStatus(l, e.target.value)}
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <button className="btn btn-outline" onClick={() => setModal(l)}>
                        <Pencil size={15} /> Edit
                      </button>
                      <button className="btn btn-danger-outline" onClick={() => remove(l)}>
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {modal && (
        <ListingFormModal
          listing={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}
    </>
  )
}
