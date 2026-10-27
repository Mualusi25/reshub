import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import Field from '../components/Field'
import ResendVerification from '../components/ResendVerification'

const HOME = { provider: '/provider', agent: '/agent', admin: '/admin' }

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const started = useRef(false)

  const [state, setState] = useState(token ? 'working' : 'error') // working | done | already | error
  const [message, setMessage] = useState(token ? '' : 'This link is not valid.')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!token || started.current) return
    started.current = true

    api
      .post('/auth/verify-email', { token })
      .then(({ data }) => {
        if (data.token) {
          setSession(data.token, data.user)
          setMessage(data.message)
          setState('done')
          setTimeout(() => navigate(HOME[data.user.role] || '/', { replace: true }), 2500)
        } else {
          setMessage(data.message)
          setState('already')
        }
      })
      .catch((err) => {
        setMessage(err.response?.data?.error || 'We could not verify your email. Please try again.')
        setState('error')
      })
  }, [token, navigate, setSession])

  return (
    <div className="auth">
      <div className="auth-card verify-card">
        {state === 'working' && (
          <>
            <Loader2 className="spin" size={44} />
            <h1>Verifying your email…</h1>
          </>
        )}

        {state === 'done' && (
          <>
            <CheckCircle2 size={44} />
            <h1>Email verified</h1>
            <p>{message}</p>
            <p className="hint">Taking you to your account…</p>
          </>
        )}

        {state === 'already' && (
          <>
            <CheckCircle2 size={44} />
            <h1>Already verified</h1>
            <p>{message}</p>
            <Link to="/login" className="btn btn-primary">Sign in</Link>
          </>
        )}

        {state === 'error' && (
          <>
            <XCircle size={44} className="err-icon" />
            <h1>Verification failed</h1>
            <p>{message}</p>
            <div style={{ width: '100%', textAlign: 'left' }}>
              <Field label="Your email address" id="email">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            </div>
            {/^\S+@\S+\.\S+$/.test(email) && <ResendVerification email={email} />}
            <p className="alt-text">
              <Link to="/login">Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}