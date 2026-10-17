import { createContext, useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { errMsg } from '../api'
import { useAuth } from './AuthContext'

const SavedContext = createContext(null)

export function SavedProvider({ children }) {
  const { user } = useAuth()
  const [ids, setIds] = useState(new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (user?.role !== 'student') {
      setIds(new Set())
      setLoaded(false)
      return
    }
    api
      .get('/saved')
      .then(({ data }) => setIds(new Set(data.ids)))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [user])

  const flip = (id, add) =>
    setIds((prev) => {
      const next = new Set(prev)
      add ? next.add(id) : next.delete(id)
      return next
    })

  const toggle = async (id) => {
    const wasSaved = ids.has(id)
    flip(id, !wasSaved) // optimistic update
    try {
      if (wasSaved) await api.delete(`/saved/${id}`)
      else await api.post(`/saved/${id}`)
      toast.success(wasSaved ? 'Removed from saved listings' : 'Saved to your list')
    } catch (err) {
      flip(id, wasSaved) // revert
      toast.error(errMsg(err))
    }
  }

  return <SavedContext.Provider value={{ ids, loaded, toggle }}>{children}</SavedContext.Provider>
}

export const useSaved = () => useContext(SavedContext)
