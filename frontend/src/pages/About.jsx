import Features from '../components/Features'

export default function About() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>About ResHub</h1>
          <p>
            ResHub connects students with safe, affordable and verified accommodation near their
            campus, and gives providers a simple way to reach the right tenants.
          </p>
        </div>
      </section>
      <Features />
    </>
  )
}