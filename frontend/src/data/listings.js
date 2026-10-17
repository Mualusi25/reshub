import { Building2, House, Hotel, Warehouse } from 'lucide-react'

export const INSTITUTIONS = [
  'University of Pretoria',
  'University of South Africa',
  'Tshwane University of Technology',
  'Richfield Graduate Institute',
  'University of Johannesburg',
]

export const PRICE_RANGES = [
  { value: 'under-3000', label: 'Under R3,000', min: 0, max: 3000 },
  { value: '3000-4000', label: 'R3,000 - R4,000', min: 3000, max: 4000 },
  { value: '4000-5000', label: 'R4,000 - R5,000', min: 4000, max: 5000 },
  { value: '5000-plus', label: 'R5,000+', min: 5000, max: Infinity },
]

export const STATUS_LABELS = {
  available: 'Available',
  limited: 'Limited',
  booked: 'Fully Booked',
}

export const LISTINGS = [
  { id: 1, name: 'Sunrise Apartments', price: 4500, distance: 0.8, area: 'Hatfield', campus: 'University of Pretoria', rating: 4.5, reviews: 28, status: 'limited', icon: Building2 },
  { id: 2, name: 'Campus View Residence', price: 3800, distance: 1.2, area: 'Arcadia', campus: 'University of Pretoria', rating: 4.3, reviews: 18, status: 'available', icon: House },
  { id: 3, name: 'Maple House', price: 4200, distance: 0.5, area: 'Hatfield', campus: 'University of Pretoria', rating: 4.6, reviews: 32, status: 'booked', icon: Warehouse },
  { id: 4, name: 'Urban Nest', price: 3600, distance: 1.5, area: 'Pretoria Central', campus: 'Tshwane University of Technology', rating: 4.2, reviews: 12, status: 'available', icon: House },
  { id: 5, name: 'Greenfield Studios', price: 5200, distance: 0.9, area: 'Brooklyn', campus: 'University of Pretoria', rating: 4.7, reviews: 41, status: 'available', icon: Hotel },
  { id: 6, name: 'Hillcrest Lodge', price: 2900, distance: 2.1, area: 'Sunnyside', campus: 'University of South Africa', rating: 4.0, reviews: 9, status: 'available', icon: Building2 },
]