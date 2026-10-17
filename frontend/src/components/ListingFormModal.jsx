import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, ImagePlus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errMsg } from '../api'
import Field from './Field'
import { INSTITUTIONS, STATUS_LABELS } from '../data/listings'

const MAX_PHOTOS = 8
const RECOMMENDED_PHOTOS = 5
const MAX_BYTES = 5 * 1024 * 1024

export default function ListingFormModal({ listing, onClose, onSaved }) {
  const editing = !!listing
  const [images, setImages] = useState(
    listing?.images?.length ? listing.images : listing?.imageUrl ? [listing.imageUrl] : []
  )
  const [uploading, setUploading] = useState(0)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: listing?.name ?? '',
      price: listing?.price ?? '',
      distance: listing?.distance ?? '',
      area: listing?.area ?? '',
      campus: listing?.campus ?? '',
      status: listing?.status ?? 'available',
      description: listing?.description ?? '',
    },
  })

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return

    const room = MAX_PHOTOS - images.length - uploading
    if (room <= 0) {
      toast.error(`You can add up to ${MAX_PHOTOS} photos.`)
      return
    }
    const chosen = files.slice(0, room)
    if (files.length > room) {
      toast(`Only ${room} more photo${room === 1 ? '' : 's'} can be added. The rest were skipped.`)
    }

    setUploading((n) => n + chosen.length)
    const uploaded = []
    for (const file of chosen) {
      try {
        if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 5 MB.`)
        const body = new FormData()
        body.append('file', file)
        const { data } = await api.post('/uploads', body)
        uploaded.push(data.url)
      } catch (err) {
        toast.error(err.response ? errMsg(err) : err.message)
      } finally {
        setUploading((n) => n - 1)
      }
    }
    if (uploaded.length) setImages((prev) => [...prev, ...uploaded].slice(0, MAX_PHOTOS))
  }

  const move = (i, step) =>
    setImages((list) => {
      const j = i + step
      if (j < 0 || j >= list.length) return list
      const next = [...list]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  const removeAt = (i) => setImages((list) => list.filter((_, k) => k !== i))

  const onSubmit = async (values) => {
    const payload = { ...values, images }
    try {
      const { data } = editing
        ? await api.put(`/listings/${listing.id}`, payload)
        : await api.post('/listings', payload)
      toast.success(
        editing
          ? listing.isVerified && !data.listing.isVerified
            ? 'Listing updated and sent for re-review'
            : 'Listing updated'
          : data.listing.isVerified
            ? 'Listing created'
            : 'Listing created. It goes live once an admin verifies it'
      )
      onSaved(data.listing)
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          <X size={20} />
        </button>
        <h2 id="listing-title">{editing ? 'Edit listing' : 'Add a listing'}</h2>
        <p className="modal-sub">Students will see this on the Browse page.</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-grid">
            <div className="full">
              <Field label="Property name" id="name" error={errors.name}>
                <input id="name" {...register('name', { required: 'Name is required' })} />
              </Field>
            </div>

            <Field label="Price per month (R)" id="price" error={errors.price}>
              <input
                id="price"
                type="number"
                min="1"
                step="1"
                {...register('price', {
                  required: 'Price is required',
                  validate: (v) =>
                    (Number.isInteger(Number(v)) && Number(v) > 0) || 'Enter a whole number of rands',
                })}
              />
            </Field>

            <Field label="Distance from campus (km)" id="distance" error={errors.distance}>
              <input
                id="distance"
                type="number"
                min="0"
                step="0.1"
                {...register('distance', {
                  required: 'Distance is required',
                  validate: (v) => Number(v) >= 0 || 'Cannot be negative',
                })}
              />
            </Field>

            <Field label="Suburb / area" id="area" error={errors.area}>
              <input id="area" {...register('area', { required: 'Area is required' })} />
            </Field>

            <Field label="Nearest institution" id="campus" error={errors.campus}>
              <select id="campus" {...register('campus', { required: 'Choose an institution' })}>
                <option value="">Select institution</option>
                {INSTITUTIONS.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </Field>

            <Field label="Availability" id="status">
              <select id="status" {...register('status')}>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>

            <div className="full">
              <Field label="Description" id="description" error={errors.description}>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="Rooms, amenities, security, WiFi, distance to transport…"
                  {...register('description', {
                    maxLength: { value: 1000, message: 'Maximum 1000 characters' },
                  })}
                />
              </Field>
            </div>

            <div className="full">
              <div className="field">
                <label htmlFor="photos">
                  Photos ({images.length} / {MAX_PHOTOS})
                </label>

                <div className="photo-grid">
                  {images.map((src, i) => (
                    <div className="photo-tile" key={src}>
                      <img src={src} alt={`Photo ${i + 1}`} />
                      {i === 0 && <span className="photo-cover">Cover</span>}
                      <div className="photo-actions">
                        <button
                          type="button"
                          aria-label="Move photo earlier"
                          disabled={i === 0}
                          onClick={() => move(i, -1)}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label="Move photo later"
                          disabled={i === images.length - 1}
                          onClick={() => move(i, 1)}
                        >
                          <ChevronRight size={16} />
                        </button>
                        <button
                          type="button"
                          className="danger"
                          aria-label="Remove photo"
                          onClick={() => removeAt(i)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {Array.from({ length: uploading }, (_, k) => (
                    <div className="photo-tile uploading" key={`uploading-${k}`}>Uploading…</div>
                  ))}

                  {images.length + uploading < MAX_PHOTOS && (
                    <label className="photo-add" htmlFor="photos">
                      <ImagePlus size={24} />
                      <span>Add photos</span>
                      <input
                        id="photos"
                        className="sr-only"
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={onFiles}
                      />
                    </label>
                  )}
                </div>

                <p className="hint">
                  JPG, PNG or WebP, up to 5 MB each. The first photo is the cover shown in search
                  results.
                  {images.length < RECOMMENDED_PHOTOS &&
                    ` We recommend at least ${RECOMMENDED_PHOTOS} photos.`}
                </p>
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-block" disabled={isSubmitting || uploading > 0}>
            {isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Create listing'}
          </button>
        </form>
      </div>
    </div>
  )
}
