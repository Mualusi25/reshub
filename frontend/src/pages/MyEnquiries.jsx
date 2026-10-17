import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errMsg } from '../api'
import { fmtDate } from '../utils'

export default function MyEnquiries() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/enquiries/mine')
      .then(({ data }) => setItems(data.enquiries))
      .catch((err) => toast.error(errMsg(err, 'Could not load your enquiries.')))
      .finally(() => setLoading(false))
  }, [])

  const cancel = async (id) => {
    try {
      const { data } = await api.post(`/enquiries/${id}/cancel`)
      setItems((list) => list.map((e) => (e.id === id ? data.enquiry : e)))
      toast.success('Enquiry cancelled')
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>My Enquiries</h1>
          <p>Track the viewing requests you have sent to providers.</p>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          {loading ? (
            <div className="loading">Loading…</div>
          ) : items.length === 0 ? (
            <div className="empty">
              <h3>No enquiries yet</h3>
              <p style={{ margin: '8px 0 18px' }}>Find a property and request a viewing.</p>
              <Link to="/accommodation" className="btn btn-primary">Browse Accommodation</Link>
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
                    </div>
                    <span className={`badge ${e.status}`}>{e.status}</span>
                  </div>
                  <p className="item-msg">{e.message}</p>
                  {e.providerNote && <p className="item-note"><strong>Provider note:</strong> {e.providerNote}</p>}
                  {e.status === 'pending' && (
                    <div className="item-actions">
                      <button className="btn btn-danger-outline" onClick={() => cancel(e.id)}>
                        Cancel enquiry
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
