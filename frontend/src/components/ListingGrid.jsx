import PropertyCard from './PropertyCard'

export default function ListingGrid({
  listings,
  loading,
  error,
  emptyTitle = 'No matches found',
  emptyText = 'Try a different suburb, institution or price range.',
}) {
  if (loading) return <div className="loading">Loading properties…</div>
  if (error)
    return (
      <div className="empty">
        <h3>Something went wrong</h3>
        <p>{error}</p>
      </div>
    )
  if (!listings.length)
    return (
      <div className="empty">
        <h3>{emptyTitle}</h3>
        <p>{emptyText}</p>
      </div>
    )
  return (
    <div className="cards">
      {listings.map((p) => (
        <PropertyCard key={p.id} p={p} />
      ))}
    </div>
  )
}
