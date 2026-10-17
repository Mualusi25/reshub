import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MapPin, GraduationCap, Wallet, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import Field from './Field'
import { INSTITUTIONS, PRICE_RANGES } from '../data/listings'

export default function SearchForm({ allowEmpty = false }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [location, setLocation] = useState(params.get('location') || '')
  const [institution, setInstitution] = useState(params.get('institution') || '')
  const [price, setPrice] = useState(params.get('price') || '')

  const onSubmit = (e) => {
    e.preventDefault()
    if (!allowEmpty && !location.trim() && !institution && !price) {
      toast.error('Please enter or select at least one search option.')
      return
    }
    const q = new URLSearchParams()
    if (location.trim()) q.set('location', location.trim())
    if (institution) q.set('institution', institution)
    if (price) q.set('price', price)
    navigate(`/accommodation?${q.toString()}`)
  }

  return (
    <form className="search-box" onSubmit={onSubmit}>
      <Field label="Location" id="location" icon={MapPin}>
        <input
          id="location"
          type="text"
          placeholder="Suburb or property name"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </Field>

      <Field label="Institution" id="institution" icon={GraduationCap}>
        <select id="institution" value={institution} onChange={(e) => setInstitution(e.target.value)}>
          <option value="">Select institution</option>
          {INSTITUTIONS.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </Field>

      <Field label="Price Range" id="price" icon={Wallet}>
        <select id="price" value={price} onChange={(e) => setPrice(e.target.value)}>
          <option value="">Select range</option>
          {PRICE_RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </Field>

      <button type="submit" className="btn btn-primary">
        <Search size={16} /> Find Accommodation
      </button>
    </form>
  )
}