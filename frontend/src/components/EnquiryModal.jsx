import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errMsg } from '../api'
import Field from './Field'

const localToday = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)

export default function EnquiryModal({ listing, onClose }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onSubmit = async (values) => {
    try {
      await api.post('/enquiries', {
        listingId: listing.id,
        message: values.message,
        moveInDate: values.moveInDate,
      })
      toast.success('Enquiry sent! The provider will respond soon.')
      onClose()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          <X size={20} />
        </button>
        <h2 id="enquiry-title">Request a viewing</h2>
        <p className="modal-sub">
          {listing.name} · R{listing.price.toLocaleString('en-ZA')} / month
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field label="Preferred move-in date" id="moveInDate" error={errors.moveInDate}>
            <input
              id="moveInDate"
              type="date"
              min={localToday()}
              {...register('moveInDate', { required: 'Choose a move-in date' })}
            />
          </Field>

          <Field label="Message to the provider" id="message" error={errors.message}>
            <textarea
              id="message"
              rows={4}
              placeholder="Introduce yourself and ask any questions about the room."
              {...register('message', {
                required: 'Message is required',
                minLength: { value: 10, message: 'At least 10 characters' },
              })}
            />
          </Field>

          <button className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send enquiry'}
          </button>
        </form>
      </div>
    </div>
  )
}
