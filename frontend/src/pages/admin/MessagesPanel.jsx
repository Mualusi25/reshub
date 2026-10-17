import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errMsg } from '../../api'
import { fmtDate } from '../../utils'

export default function MessagesPanel({ onChange }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/admin/messages')
      .then(({ data }) => setItems(data.messages))
      .catch((err) => toast.error(errMsg(err)))
      .finally(() => setLoading(false))
  }, [])

  const setRead = async (m, isRead) => {
    try {
      const { data } = await api.patch(`/admin/messages/${m.id}`, { isRead })
      setItems((list) => list.map((x) => (x.id === m.id ? data.message : x)))
      onChange()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const remove = async (m) => {
    if (!window.confirm(`Delete the message from ${m.name}?`)) return
    try {
      await api.delete(`/admin/messages/${m.id}`)
      setItems((list) => list.filter((x) => x.id !== m.id))
      toast.success('Message deleted')
      onChange()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  if (loading) return <div className="loading">Loading…</div>
  if (items.length === 0)
    return (
      <div className="empty">
        <h3>No messages yet</h3>
        <p>Messages sent from the Contact page will appear here.</p>
      </div>
    )

  return (
    <div className="list">
      {items.map((m) => (
        <article className={`item ${m.isRead ? '' : 'unread'}`} key={m.id}>
          <div className="item-head">
            <div>
              <h3>{m.name}</h3>
              <div className="meta">
                <Mail size={14} /> <a href={`mailto:${m.email}`}>{m.email}</a>
              </div>
              <div className="meta">{fmtDate(m.createdAt)}</div>
            </div>
            {!m.isRead && <span className="badge pending">New</span>}
          </div>
          <p className="item-msg">{m.message}</p>
          <div className="item-actions">
            <a
              className="btn btn-primary btn-sm"
              href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message to ResHub')}`}
            >
              Reply by email
            </a>
            <button className="btn btn-outline btn-sm" onClick={() => setRead(m, !m.isRead)}>
              {m.isRead ? 'Mark unread' : 'Mark read'}
            </button>
            <button className="btn btn-danger-outline btn-sm" onClick={() => remove(m)}>
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
