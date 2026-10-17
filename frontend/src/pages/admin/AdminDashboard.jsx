import { useCallback, useEffect, useState } from 'react'
import api from '../../api'
import ListingsPanel from './ListingsPanel'
import UsersPanel from './UsersPanel'
import MessagesPanel from './MessagesPanel'

const TABS = [
  { id: 'listings', label: 'Listings', badge: 'pendingListings' },
  { id: 'users', label: 'Users', badge: 'pendingProviders' },
  { id: 'messages', label: 'Messages', badge: 'unreadMessages' },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState('listings')
  const [stats, setStats] = useState(null)

  const refresh = useCallback(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const cards = [
    ['Listings awaiting review', stats?.pendingListings],
    ['Providers awaiting verification', stats?.pendingProviders],
    ['Unread messages', stats?.unreadMessages],
    ['Total listings', stats?.listings],
    ['Providers', stats?.providers],
    ['Students', stats?.students],
    ['Enquiries', stats?.enquiries],
  ]

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Admin Dashboard</h1>
          <p>Verify listings and providers, manage users and read contact messages.</p>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="stats">
            {cards.map(([label, value]) => (
              <div className="stat" key={label}>
                <strong>{value ?? '—'}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={`tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {stats?.[t.badge] > 0 && <span className="tab-count">{stats[t.badge]}</span>}
              </button>
            ))}
          </div>

          {tab === 'listings' && <ListingsPanel onChange={refresh} />}
          {tab === 'users' && <UsersPanel onChange={refresh} />}
          {tab === 'messages' && <MessagesPanel onChange={refresh} />}
        </div>
      </section>
    </>
  )
}
