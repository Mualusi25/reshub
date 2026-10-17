import { useEffect, useState } from 'react'
import ListingGrid from '../components/ListingGrid'
import { useSaved } from '../context/SavedContext'
import api, { errMsg } from '../api'

export default function Saved() {
  const { ids, loaded } = useSaved()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/saved')
      .then(({ data }) => setListings(data.listings))
      .catch((err) => setError(errMsg(err, 'Could not load saved listings.')))
      .finally(() => setLoading(false))
  }, [])

  // Un-saving a card removes it from this page straight away
  const visible = listings.filter((l) => ids.has(l.id))

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Saved Listings</h1>
          <p>Properties you have saved for later.</p>
        </div>
      </section>
      <section className="section alt">
        <div className="container">
          <ListingGrid
            listings={visible}
            loading={loading || !loaded}
            error={error}
            emptyTitle="Nothing saved yet"
            emptyText="Tap the heart on a property to save it here."
          />
        </div>
      </section>
    </>
  )
}
