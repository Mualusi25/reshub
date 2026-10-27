import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errMsg } from '../api'

const COOLDOWN = 60

export default function ResendVerification({ email, startCooldown = false }) {
  const [wait, setWait] = useState(startCooldown ? COOLDOWN : 0)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  const resend = async () => {
    setSending(true)
    try {
      const { data } = await api.post('/auth/resend-verification', { email })
      toast.success(data.message)
      setWait(COOLDOWN)
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <button type="button" className="btn btn-outline" onClick={resend} disabled={sending || wait > 0}>
      <Mail size={16} />
      {wait > 0 ? `Resend available in ${wait}s` : sending ? 'Sending…' : 'Resend verification email'}
    </button>
  )
}