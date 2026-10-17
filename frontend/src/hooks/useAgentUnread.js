import { useEffect, useState } from 'react'
import api from '../api'

// Number of open conversations with unread student messages (agents/admins only)
export default function useAgentUnread(enabled) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setCount(0)
      return
    }
    let cancelled = false
    const load = () => {
      if (document.hidden) return
      api
        .get('/chat/summary')
        .then(({ data }) => !cancelled && setCount(data.unread))
        .catch(() => {})
    }
    load()
    const t = setInterval(load, 15000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [enabled])

  return count
}
