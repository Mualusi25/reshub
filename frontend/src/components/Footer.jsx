import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const MY_LINKS = {
  student: [['/saved', 'Saved Listings'], ['/my-enquiries', 'My Enquiries']],
  provider: [['/provider', 'Dashboard'], ['/provider/listings', 'My Listings']],
  agent: [['/agent', 'Chat Inbox']],
  admin: [['/admin', 'Admin Dashboard'], ['/agent', 'Chat Inbox']],
}

export default function Footer() {
  const { user, loading } = useAuth()

  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <div className="footer-logo">
            Res<span>Hub</span>
          </div>
          <p>Find Your Perfect Student Home.</p>
          <p>
            ResHub makes it easier for students to discover safe, affordable and verified
            accommodation.
          </p>
        </div>

        <div>
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/accommodation">Browse</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          {loading ? null : user ? (
            <>
              <h3>My Account</h3>
              <ul>
                {(MY_LINKS[user.role] || []).map(([to, label]) => (
                  <li key={to}><Link to={to}>{label}</Link></li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h3>Account</h3>
              <ul>
                <li><Link to="/login">Student Login</Link></li>
                <li><Link to="/provider-login">Provider Login</Link></li>
                <li><Link to="/agent-login">Agent Login</Link></li>
                <li><Link to="/admin-login">Administrator Login</Link></li>
                <li><Link to="/register">Register</Link></li>
              </ul>
            </>
          )}
        </div>

        <div>
          <h3>Contact Us</h3>
          <ul>
            <li className="icon-line"><Mail size={16} /> support@reshub.co.za</li>
            <li className="icon-line"><Phone size={16} /> +27 12 345 6789</li>
            <li className="icon-line"><MapPin size={16} /> 120 University Road, Pretoria, South Africa</li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        © 2026 ResHub. All rights reserved. &nbsp;|&nbsp; Privacy Policy &nbsp;|&nbsp; Terms &amp; Conditions
      </div>
    </footer>
  )
}
