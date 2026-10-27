import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ChatWidget from './components/ChatWidget'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Browse from './pages/Browse'
import ListingDetail from './pages/ListingDetail'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import Saved from './pages/Saved'
import MyEnquiries from './pages/MyEnquiries'
import ProviderDashboard from './pages/ProviderDashboard'
import ProviderListings from './pages/ProviderListings'
import AgentInbox from './pages/AgentInbox'
import AdminDashboard from './pages/admin/AdminDashboard'
import NotFound from './pages/NotFound'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Toaster position="top-center" />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/accommodation" element={<Browse />} />
          <Route path="/accommodation/:id" element={<ListingDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login role="student" />} />
          <Route path="/provider-login" element={<Login role="provider" />} />
          <Route path="/agent-login" element={<Login role="agent" />} />
          <Route path="/admin-login" element={<Login role="admin" />} />
          <Route path="/register" element={<Register />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
          <Route
            path="/saved"
            element={<ProtectedRoute roles={['student']}><Saved /></ProtectedRoute>}
          />
          <Route
            path="/my-enquiries"
            element={<ProtectedRoute roles={['student']}><MyEnquiries /></ProtectedRoute>}
          />
          <Route
            path="/provider"
            element={<ProtectedRoute roles={['provider', 'admin']}><ProviderDashboard /></ProtectedRoute>}
          />
          <Route
            path="/provider/listings"
            element={<ProtectedRoute roles={['provider', 'admin']}><ProviderListings /></ProtectedRoute>}
          />
          <Route
            path="/agent"
            element={<ProtectedRoute roles={['agent', 'admin']}><AgentInbox /></ProtectedRoute>}
          />
          <Route
            path="/admin"
            element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <ChatWidget />
    </>
  )
}
