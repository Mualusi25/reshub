import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errMsg } from '../api'
import { fmtStamp, mergeMessages } from '../utils'

export default function AgentThread({ id, onBack, onChanged }) {
  const [conv, setConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const lastId = useRef(0)
  const listRef = useRef(null)
  const changedRef = useRef(onChanged)
  changedRef.current = onChanged

  useEffect(() => {
    let cancelled = false
    lastId.current = 0

    const load = async (first) => {
      if (document.hidden && !first) return
      try {
        const { data } = await api.get(`/chat/conversations/${id}`, {
          params: { after: lastId.current },
        })
        if (cancelled) return
        if (data.messages.length) {
          lastId.current = data.messages[data.messages.length - 1].id
          setMessages((prev) => mergeMessages(prev, data.messages))
        }
        setConv(data.conversation)
        if (first || data.messages.length) changedRef.current()
      } catch (err) {
        if (first && !cancelled) toast.error(errMsg(err))
      } finally {
        if (first && !cancelled) setLoading(false)
      }
    }

    load(true)
    const t = setInterval(() => load(false), 3000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [id])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const send = async (e) => {
    e?.preventDefault()
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    try {
      const { data } = await api.post(`/chat/conversations/${id}/messages`, { body })
      setMessages((prev) => mergeMessages(prev, [data.message]))
      setConv(data.conversation)
      setText('')
      changedRef.current()
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setSending(false)
    }
  }

  const setStatus = async (status) => {
    try {
      const { data } = await api.patch(`/chat/conversations/${id}`, { status })
      setConv(data.conversation)
      toast.success(status === 'closed' ? 'Marked as resolved' : 'Conversation reopened')
      changedRef.current()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  if (loading) return <div className="loading">Loading…</div>
  if (!conv) return <div className="inbox-empty">Conversation not available.</div>

  return (
    <>
      <header className="thread-head">
        <button className="inbox-back" onClick={onBack} aria-label="Back to conversations">
          <ArrowLeft size={18} />
        </button>
        <div className="thread-who">
          <strong>{conv.student.fullName}</strong>
          <span>
            <a href={`mailto:${conv.student.email}`}>{conv.student.email}</a>
            {conv.agentName && ` · Handled by ${conv.agentName}`}
          </span>
        </div>
        <span
          className={`badge ${conv.status === 'open' ? 'approved' : 'declined'}`}
          style={{ marginBottom: 0 }}
        >
          {conv.status === 'open' ? 'Open' : 'Resolved'}
        </span>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setStatus(conv.status === 'open' ? 'closed' : 'open')}
        >
          {conv.status === 'open' ? 'Mark resolved' : 'Reopen'}
        </button>
      </header>

      <div className="chat-body" ref={listRef}>
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.senderRole === 'agent' ? 'mine' : 'theirs'}`}>
            {m.senderRole === 'agent' && <span className="who">{m.senderName}</span>}
            {m.body}
            <time>{fmtStamp(m.createdAt)}</time>
          </div>
        ))}
      </div>

      <form className="chat-compose" onSubmit={send}>
        <textarea
          rows={2}
          maxLength={1000}
          placeholder="Write a reply… (Enter to send, Shift+Enter for a new line)"
          aria-label="Reply"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send(e)}
        />
        <button className="btn btn-primary" disabled={sending || !text.trim()} aria-label="Send reply">
          <Send size={16} />
        </button>
      </form>
    </>
  )
}