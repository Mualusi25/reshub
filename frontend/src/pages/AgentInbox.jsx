import { useCallback, useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errMsg } from '../api'
import { fmtStamp } from '../utils'
import AgentThread from '../components/AgentThread'

const FILTERS = [
  ['open', 'Open'],
  ['closed', 'Resolved'],
  ['all', 'All'],
]

export default function AgentInbox() {
  const [status, setStatus] = useState('open')
  const [q, setQ] = useState('')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  const loadList = useCallback(
    async (silent) => {
      try {
        const { data } = await api.get('/chat/conversations', { params: { status, q } })
        setList(data.conversations)
      } catch (err) {
        if (!silent) toast.error(errMsg(err))
      } finally {
        setLoading(false)
      }
    },
    [status, q]
  )

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => loadList(false), 250)
    return () => clearTimeout(t)
  }, [loadList])

  useEffect(() => {
    const t = setInterval(() => {
      if (!document.hidden) loadList(true)
    }, 6000)
    return () => clearInterval(t)
  }, [loadList])

  const refresh = useCallback(() => loadList(true), [loadList])

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Chat Inbox</h1>
          <p>Answer questions from students. New messages appear automatically.</p>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className={`inbox ${selectedId ? 'has-thread' : ''}`}>
            <aside className="inbox-list">
              <div className="inbox-filters">
                {FILTERS.map(([value, label]) => (
                  <button
                    key={value}
                    className={`chip ${status === value ? 'active' : ''}`}
                    onClick={() => setStatus(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                type="search"
                className="inbox-search"
                placeholder="Search by name or email"
                aria-label="Search conversations"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />

              {loading ? (
                <div className="loading">Loading…</div>
              ) : list.length === 0 ? (
                <div className="inbox-empty small">No conversations here.</div>
              ) : (
                list.map((c) => (
                  <button
                    key={c.id}
                    className={`conv ${selectedId === c.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <div className="conv-top">
                      <strong>{c.student.fullName}</strong>
                      <time>{fmtStamp(c.lastMessageAt)}</time>
                    </div>
                    <div className="conv-preview">
                      {c.lastMessage
                        ? (c.lastMessage.senderRole === 'agent' ? 'You: ' : '') + c.lastMessage.body
                        : ''}
                    </div>
                    <div className="conv-meta">
                      {c.status === 'closed' && <span className="sub">Resolved</span>}
                      {c.unread > 0 && <span className="tab-count">{c.unread} new</span>}
                    </div>
                  </button>
                ))
              )}
            </aside>

            <div className="inbox-thread">
              {selectedId ? (
                <AgentThread
                  key={selectedId}
                  id={selectedId}
                  onBack={() => setSelectedId(null)}
                  onChanged={refresh}
                />
              ) : (
                <div className="inbox-empty">
                  <MessageSquare size={36} strokeWidth={1.4} />
                  <p>Select a conversation to read and reply.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}