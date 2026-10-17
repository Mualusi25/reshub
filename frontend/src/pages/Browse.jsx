import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SearchForm from '../components/SearchForm'
import ListingGrid from '../components/ListingGrid'
import api, { errMsg } from '../api'

export default function Browse() {
  const [params] = useSearchParams()
  const query = params.toString()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api
      .get(`/listings${query ? `?${query}` : ''}`)
      .then(({ data }) => setListings(data.listings))
      .catch((err) => setError(errMsg(err, 'Could not load properties.')))
      .finally(() => setLoading(false))
  }, [query])

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Browse Accommodation</h1>
          <p>Filter verified student accommodation by location, institution and price.</p>
          <SearchForm allowEmpty />
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          {!loading && !error && (
            <p className="result-count">
              {listings.length} {listings.length === 1 ? 'property' : 'properties'} found
            </p>
          )}
          <ListingGrid listings={listings} loading={loading} error={error} />
        </div>
      </section>
    </>
  )
}
