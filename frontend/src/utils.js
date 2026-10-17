export const fmtDate = (iso) =>
  iso
    ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''

// "14:05" for today, "3 Oct, 14:05" otherwise (local time)
export const fmtStamp = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const time = d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
  return d.toDateString() === new Date().toDateString()
    ? time
    : `${d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}, ${time}`
}

// Merge chat messages by id, oldest first (safe against duplicates from polling)
export const mergeMessages = (prev, incoming) => {
  const map = new Map(prev.map((m) => [m.id, m]))
  incoming.forEach((m) => map.set(m.id, m))
  return [...map.values()].sort((a, b) => a.id - b.id)
}
