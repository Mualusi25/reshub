import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, House } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import useAgentUnread from '../hooks/useAgentUnread'

const baseLinks = [
  ['/', 'Home'],
  ['/accommodation', 'Browse'],
  ['/about', 'About Us'],
  ['/contact', 'Contact'],
]

const roleLinks = {
  student: [['/saved', 'Saved'], ['/my-enquiries', 'My Enquiries']],
  provider: [['/provider', 'Dashboard'], ['/provider/listings', 'My Listings']],
  agent: [['/agent', 'Chat Inbox']],
  admin: [['/admin', 'Admin'], ['/agent', 'Chat Inbox']],
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const unread = useAgentUnread(user?.role === 'agent' || user?.role === 'admin')
  const close = () => setOpen(false)
  const links = [...baseLinks, ...(roleLinks[user?.role] || [])]

  const handleLogout = () => {
    logout()
    close()
    navigate('/')
    toast.success('Signed out')
  }

  const label = (to, text) => (
    <>
      {text}
      {to === '/agent' && unread > 0 && <span className="nav-badge">{unread}</span>}
    </>
  )

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo" onClick={close}>
          <span className="logo-icon">
            <House size={22} />
          </span>
          <span className="logo-text">
            <strong>
              Res<span>Hub</span>
            </strong>
            <small>STUDENT ACCOMMODATION</small>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Main">
          {links.map(([to, text]) => (
            <NavLink key={to} to={to} end={to === '/' || to === '/provider'}>
              {label(to, text)}
            </NavLink>
          ))}
        </nav>

        <div className="nav-buttons">
          {user ? (
            <>
              <span className="nav-user">Hi, {user.fullName.split(' ')[0]}</span>
              <button className="btn btn-outline" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Student Login</Link>
              <Link to="/provider-login" className="btn btn-outline">Provider Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>

        <button
          className="menu-toggle"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {open && (
        <div className="mobile-panel">
          {links.map(([to, text]) => (
            <NavLink key={to} to={to} end={to === '/' || to === '/provider'} onClick={close}>
              {label(to, text)}
            </NavLink>
          ))}
          <div className="mobile-actions">
            {user ? (
              <>
                <span className="mobile-user">Signed in as {user.fullName}</span>
                <button className="btn btn-outline" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline" onClick={close}>Student Login</Link>
                <Link to="/provider-login" className="btn btn-outline" onClick={close}>Provider Login</Link>
                <Link to="/register" className="btn btn-primary" onClick={close}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
