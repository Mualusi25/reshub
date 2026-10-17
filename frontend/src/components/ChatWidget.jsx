import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MessageCircle, X, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errMsg } from '../api'
import { useAuth } from '../context/AuthContext'
import { fmtStamp, mergeMessages } from '../utils'

export default function ChatWidget() {
  const { user } = useAuth()
  const location = useLocation()
  const isStudent = user?.role === 'student'

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [conv, setConv] = useState(null)
  const [unread, setUnread] = useState(0)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const lastId = useRef(0)
  const listRef = useRef(null)

  // start fresh whenever a different person signs in or out
  useEffect(() => {
    lastId.current = 0
    setMessages([])
    setConv(null)
    setUnread(0)
    setOpen(false)
    setText('')
  }, [user?.id])

  const poll = useCallback(async () => {
    if (document.hidden) return
    try {
      const { data } = await api.get('/chat/mine', {
        params: { after: lastId.current, open: open ? 1 : 0 },
      })
      if (data.messages.length) {
        lastId.current = data.messages[data.messages.length - 1].id
        setMessages((prev) => mergeMessages(prev, data.messages))
      }
      setConv(data.conversation)
      setUnread(data.unread)
    } catch {
      /* ignore polling errors */
    }
  }, [open])

  useEffect(() => {
    if (!isStudent) return
    poll()
    const t = setInterval(poll, open ? 4000 : 15000)
    return () => clearInterval(t)
  }, [isStudent, open, poll])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, open])

  const send = async (e) => {
    e?.preventDefault()
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    try {
      const { data } = await api.post('/chat/mine', { body })
      setMessages((prev) => mergeMessages(prev, [data.message]))
      setConv(data.conversation)
      setText('')
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) send(e)
  }

  // providers, agents and admins don't get the student chat
  if (user && !isStudent) return null

  return (
    <div className="chat">
      {open && (
        <section className="chat-panel" role="dialog" aria-label="Chat with an agent">
          <header className="chat-head">
            <div>
              <strong>Chat with an agent</strong>
              <span>
                {conv?.agentName ? `${conv.agentName} is helping you` : 'We reply as soon as we can'}
              </span>
            </div>
            <button aria-label="Close chat" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </header>

          {!user ? (
            <div className="chat-guest">
              <p>Sign in with your student account to chat with one of our agents.</p>
              <Link
                to="/login"
                state={{ from: location.pathname }}
                className="btn btn-primary"
                onClick={() => setOpen(false)}
              >
                Student login
              </Link>
              <Link to="/register" className="chat-link" onClick={() => setOpen(false)}>
                Create an account
              </Link>
            </div>
          ) : (
            <>
              <div className="chat-body" ref={listRef}>
                <div className="msg theirs">
                  Hi {user.fullName.split(' ')[0]}! Ask us anything about finding or booking student
                  accommodation.
                </div>
                {messages.map((m) => (
                  <div key={m.id} className={`msg ${m.senderRole === 'student' ? 'mine' : 'theirs'}`}>
                    {m.body}
                    <time>{fmtStamp(m.createdAt)}</time>
                  </div>
                ))}
                {conv?.status === 'closed' && (
                  <div className="chat-note">
                    This chat was marked resolved. Send a message to reopen it.
                  </div>
                )}
              </div>

              <form className="chat-compose" onSubmit={send}>
                <textarea
                  rows={1}
                  maxLength={1000}
                  placeholder="Type your message…"
                  aria-label="Message"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={onKeyDown}
                />
                <button className="btn btn-primary" disabled={sending || !text.trim()} aria-label="Send message">
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </section>
      )}

      <button
        className="chat-fab"
        aria-label={open ? 'Close chat' : 'Chat with an agent'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {!open && unread > 0 && <span className="chat-badge">{unread}</span>}
      </button>
    </div>
  )
}
