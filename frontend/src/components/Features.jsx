import { BadgeCheck, MapPin, ShieldCheck } from 'lucide-react'

const items = [
  { icon: BadgeCheck, title: 'Verified Properties', text: 'All listings are checked and verified to give students peace of mind.' },
  { icon: MapPin, title: 'Near Your Campus', text: 'Find accommodation close to your institution and reduce your daily travel time.' },
  { icon: ShieldCheck, title: 'Safe and Secure', text: 'Your safety is our priority. Connect with trusted accommodation providers.' },
]

export default function Features() {
  return (
    <section className="section why">
      <div className="container">
        <div className="section-header">
          <h2>Why Choose ResHub?</h2>
          <p>Everything you need to find your ideal student accommodation.</p>
        </div>
        <div className="features">
          {items.map(({ icon: Icon, title, text }) => (
            <div className="feature-card" key={title}>
              <div className="feature-icon"><Icon size={26} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
