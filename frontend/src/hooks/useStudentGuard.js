import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

// Returns a function: requireStudent('save listings') -> true if allowed,
// otherwise it shows a message / redirects to login and returns false.
export default function useStudentGuard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (action) => {
    if (!user) {
      toast(`Please sign in to ${action}`)
      navigate('/login', { state: { from: location.pathname + location.search } })
      return false
    }
    if (user.role !== 'student') {
      toast.error(`Only student accounts can ${action}.`)
      return false
    }
    return true
  }
}
