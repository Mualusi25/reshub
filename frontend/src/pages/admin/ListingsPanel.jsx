import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errMsg } from '../../api'
import { STATUS_LABELS } from '../../data/listings'

export default function ListingsPanel({ onChange }) {
  const [review, setReview] = useState('pending')
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const t = setTimeout(() => {
      setLoading(true)
      api
        .get('/admin/listings', { params: { review, q } })
        .then(({ data }) => !cancelled && setItems(data.listings))
        .catch((err) => !cancelled && toast.error(errMsg(err)))
        .finally(() => !cancelled && setLoading(false))
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [review, q])

  const matches = (l) =>
    review === 'all' || (review === 'pending' ? !l.isVerified : l.isVerified)

  const setVerified = async (l, isVerified) => {
    try {
      const { data } = await api.patch(`/admin/listings/${l.id}`, { isVerified })
      // keep the table in line with the current filter
      setItems((list) =>
        list.map((x) => (x.id === l.id ? data.listing : x)).filter(matches)
      )
      toast.success(isVerified ? 'Listing verified and now live' : 'Listing hidden from students')
      onChange()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const remove = async (l) => {
    const ok = window.confirm(
      `Delete "${l.name}"?\n\nThis also removes its saved entries and student enquiries.`
    )
    if (!ok) return
    try {
      await api.delete(`/listings/${l.id}`)
      setItems((list) => list.filter((x) => x.id !== l.id))
      toast.success('Listing deleted')
      onChange()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <>
      <div className="toolbar">
        <select value={review} onChange={(e) => setReview(e.target.value)} aria-label="Review filter">
          <option value="pending">Awaiting review</option>
          <option value="verified">Verified</option>
          <option value="all">All listings</option>
        </select>
        <input
          type="search"
          placeholder="Search by name or area"
          aria-label="Search listings"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : items.length === 0 ? (
        <div className="empty">
          <h3>{review === 'pending' ? 'Nothing waiting for review' : 'No listings found'}</h3>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Provider</th>
                <th>Price</th>
                <th>Availability</th>
                <th>Review</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id}>
                  <td>
                    <div className="cell-prop">
                      <div className="mini-thumb">
                        {l.imageUrl ? <img src={l.imageUrl} alt="" /> : <Building2 size={18} />}
                      </div>
                      <div>
                        <Link to={`/accommodation/${l.id}`}>{l.name}</Link>
                        <div className="sub">{l.area} · {l.campus}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {l.providerName || '—'}
                    <div className="sub">{l.providerVerified ? 'Verified provider' : 'Unverified provider'}</div>
                  </td>
                  <td>R{l.price.toLocaleString('en-ZA')}</td>
                  <td>{STATUS_LABELS[l.status]}</td>
                  <td>
                    <span className={`badge ${l.isVerified ? 'approved' : 'pending'}`} style={{ marginBottom: 0 }}>
                      {l.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className={`btn btn-sm ${l.isVerified ? 'btn-outline' : 'btn-primary'}`}
                        onClick={() => setVerified(l, !l.isVerified)}
                      >
                        {l.isVerified ? 'Unverify' : 'Verify'}
                      </button>
                      <button className="btn btn-sm btn-danger-outline" onClick={() => remove(l)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
