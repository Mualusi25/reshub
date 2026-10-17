import { useEffect, useState } from 'react'
import { MapPin, CalendarDays, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errMsg } from '../api'
import { fmtDate } from '../utils'

export default function ProviderDashboard() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState({})

  useEffect(() => {
    api
      .get('/enquiries/received')
      .then(({ data }) => setItems(data.enquiries))
      .catch((err) => toast.error(errMsg(err, 'Could not load enquiries.')))
      .finally(() => setLoading(false))
  }, [])

  const respond = async (id, status) => {
    try {
      const { data } = await api.patch(`/enquiries/${id}`, {
        status,
        providerNote: notes[id] || '',
      })
      setItems((list) => list.map((e) => (e.id === id ? data.enquiry : e)))
      toast.success(status === 'approved' ? 'Enquiry approved' : 'Enquiry declined')
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const count = (s) => items.filter((e) => e.status === s).length

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Provider Dashboard</h1>
          <p>Review and respond to viewing requests for your properties.</p>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="stats">
            <div className="stat"><strong>{count('pending')}</strong><span>Pending</span></div>
            <div className="stat"><strong>{count('approved')}</strong><span>Approved</span></div>
            <div className="stat"><strong>{items.length}</strong><span>Total enquiries</span></div>
          </div>

          {loading ? (
            <div className="loading">Loading…</div>
          ) : items.length === 0 ? (
            <div className="empty">
              <h3>No enquiries yet</h3>
              <p>Student viewing requests for your properties will appear here.</p>
            </div>
          ) : (
            <div className="list">
              {items.map((e) => (
                <article className="item" key={e.id}>
                  <div className="item-head">
                    <div>
                      <h3>{e.listing?.name}</h3>
                      <div className="meta"><MapPin size={14} /> {e.listing?.area}</div>
                      <div className="meta"><CalendarDays size={14} /> Move-in: {fmtDate(e.moveInDate)}</div>
                      <div className="meta">
                        <Mail size={14} /> {e.student?.fullName} · {e.student?.email}
                      </div>
                    </div>
                    <span className={`badge ${e.status}`}>{e.status}</span>
                  </div>
                  <p className="item-msg">{e.message}</p>
                  {e.providerNote && e.status !== 'pending' && (
                    <p className="item-note"><strong>Your note:</strong> {e.providerNote}</p>
                  )}
                  {e.status === 'pending' && (
                    <div className="item-actions">
                      <input
                        placeholder="Optional note to the student"
                        aria-label="Optional note to the student"
                        value={notes[e.id] || ''}
                        onChange={(ev) => setNotes((n) => ({ ...n, [e.id]: ev.target.value }))}
                      />
                      <button className="btn btn-primary" onClick={() => respond(e.id, 'approved')}>
                        Approve
                      </button>
                      <button className="btn btn-danger-outline" onClick={() => respond(e.id, 'declined')}>
                        Decline
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
