import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Field from '../components/Field'
import api, { errMsg } from '../api'

export default function Contact() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (values) => {
    try {
      const { data } = await api.post('/contact', values)
      toast.success(data.message)
      reset()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Contact Us</h1>
          <p>Questions about a listing or your account? Send us a message.</p>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <form className="auth-card wide" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Field label="Name" id="name" error={errors.name}>
              <input id="name" {...register('name', { required: 'Name is required' })} />
            </Field>
            <Field label="Email" id="email" error={errors.email}>
              <input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
              />
            </Field>
            <Field label="Message" id="message" error={errors.message}>
              <textarea
                id="message"
                rows={5}
                {...register('message', {
                  required: 'Message is required',
                  minLength: { value: 10, message: 'At least 10 characters' },
                })}
              />
            </Field>
            <button className="btn btn-primary btn-block" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>
      </section>
    </>
  )
}
