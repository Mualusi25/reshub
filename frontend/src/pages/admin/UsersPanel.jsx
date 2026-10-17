import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { errMsg } from '../../api'
import { fmtDate } from '../../utils'

export default function UsersPanel({ onChange }) {
  const [role, setRole] = useState('')
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const t = setTimeout(() => {
      setLoading(true)
      api
        .get('/admin/users', { params: { role, q } })
        .then(({ data }) => !cancelled && setItems(data.users))
        .catch((err) => !cancelled && toast.error(errMsg(err)))
        .finally(() => !cancelled && setLoading(false))
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [role, q])

  const update = async (u, changes, message) => {
    try {
      const { data } = await api.patch(`/admin/users/${u.id}`, changes)
      setItems((list) => list.map((x) => (x.id === u.id ? data.user : x)))
      toast.success(message)
      onChange()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const toggleActive = (u) => {
    if (u.isActive) {
      const ok = window.confirm(
        `Suspend ${u.fullName}?\n\nThey will be unable to sign in or use the site` +
          (u.role === 'provider' ? ', and their listings will be hidden from students.' : '.')
      )
      if (!ok) return
    }
    update(u, { isActive: !u.isActive }, u.isActive ? 'User suspended' : 'User reactivated')
  }

  return (
    <>
      <div className="toolbar">
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role filter">
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="provider">Providers</option>
          <option value="agent">Agents</option>
          <option value="admin">Administrators</option>
        </select>
        <input
          type="search"
          placeholder="Search by name or email"
          aria-label="Search users"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : items.length === 0 ? (
        <div className="empty"><h3>No users found</h3></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Verification</th>
                <th>Joined</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.fullName}</strong>
                    <div className="sub">{u.email}</div>
                  </td>
                  <td><span className="badge role" style={{ marginBottom: 0 }}>{u.role}</span></td>
                  <td>
                    <span className={`badge ${u.isActive ? 'approved' : 'declined'}`} style={{ marginBottom: 0 }}>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>
                    {u.role === 'provider' ? (
                      <span className={`badge ${u.isVerified ? 'approved' : 'pending'}`} style={{ marginBottom: 0 }}>
                        {u.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    ) : (
                      <span className="sub">—</span>
                    )}
                  </td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      {u.role === 'provider' && (
                        <button
                          className={`btn btn-sm ${u.isVerified ? 'btn-outline' : 'btn-primary'}`}
                          onClick={() =>
                            update(
                              u,
                              { isVerified: !u.isVerified },
                              u.isVerified ? 'Provider unverified' : 'Provider verified'
                            )
                          }
                        >
                          {u.isVerified ? 'Unverify' : 'Verify'}
                        </button>
                      )}
                      {u.role !== 'admin' && (
                        <button
                          className={`btn btn-sm ${u.isActive ? 'btn-danger-outline' : 'btn-outline'}`}
                          onClick={() => toggleActive(u)}
                        >
                          {u.isActive ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
