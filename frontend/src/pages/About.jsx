import { useState } from 'react'
import { Users } from 'lucide-react'
import Features from '../components/Features'

// The photo lives in frontend/public. Change the name if yours is different.
const TEAM_PHOTO = '/team.jpeg'

const CAPTION = 'The ResHub project team'

// Add your module, institution or year in these paragraphs if you like.
const DESCRIPTION = [
  'ResHub was designed and built by our group as a student project. We set out to solve a problem many students face: finding safe, affordable and verified accommodation close to campus, without being misled by unverified listings.',
  'Together we built the whole platform: a PostgreSQL database that stores users, properties, enquiries and chats, a Flask API that keeps everything secure, and a React website that makes searching, saving, requesting viewings and chatting with an agent simple.',
  'Every member took ownership of a part of the system, from the database migrations to the pages you are using now.',
]

// Add surnames or roles here if you want them shown.
const TEAM = [
  { area: 'Database', people: ['Lebogang', 'Palesa', 'Vhukhudo', 'Tidimatso', 'Sherine'] },
  { area: 'Backend', people: ['Tianne', 'Anele', 'Siphelele', 'Neo', 'Gift', 'Sello'] },
  { area: 'Frontend', people: ['Kgosi', 'Karabo', 'Simon', 'Sandile', 'Shibe', 'Ofentse'] },
]

export default function About() {
  const [photoFailed, setPhotoFailed] = useState(false)

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

      <section className="section alt">
        <div className="container">
          <div className="section-header">
            <h2>Meet the team</h2>
            <p>The people who designed and built ResHub.</p>
          </div>

          <figure className="team-figure">
            {photoFailed ? (
              <div className="team-placeholder">
                <Users size={48} strokeWidth={1.4} />
                <span>Team photo coming soon</span>
              </div>
            ) : (
              <img src={TEAM_PHOTO} alt={CAPTION} onError={() => setPhotoFailed(true)} />
            )}
            <figcaption>{CAPTION}</figcaption>
          </figure>

          <div className="team-text">
            {DESCRIPTION.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="team-groups">
            {TEAM.map((group) => (
              <div className="team-group" key={group.area}>
                <h3>{group.area}</h3>
                <ul>
                  {group.people.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Features />
    </>
  )
}