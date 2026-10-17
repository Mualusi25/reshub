import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SearchForm from '../components/SearchForm'
import Features from '../components/Features'
import ListingGrid from '../components/ListingGrid'
import api, { errMsg } from '../api'

export default function Home() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/listings')
      .then(({ data }) => setListings(data.listings.slice(0, 4)))
      .catch((err) => setError(errMsg(err, 'Could not load listings.')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <section className="hero">
        <div className="hero-grid">
          <div>
            <h1>
              Find Safe, Affordable <span>Student Accommodation</span> Near Your Campus
            </h1>
            <p className="lead">
              Browse verified listings, connect with trusted accommodation providers, and find
              your perfect student home — all in one place.
            </p>
            <SearchForm />
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="building">
              <div className="windows">
                {Array.from({ length: 12 }, (_, i) => (
                  <div className="window" key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Features />

      <section className="section alt">
        <div className="container">
          <div className="title-row">
            <h2>Featured Accommodation</h2>
            <Link to="/accommodation" className="view-all">View All →</Link>
          </div>
          <ListingGrid listings={listings} loading={loading} error={error} emptyTitle="No listings yet" emptyText="Check back soon." />
        </div>
      </section>

      <section className="cta">
        <h2>Ready to find your perfect student home?</h2>
        <p>Join students who use ResHub to find safe, affordable accommodation.</p>
        <Link to="/register" className="btn btn-primary">Create Your Account</Link>
      </section>
    </>
  )
}
