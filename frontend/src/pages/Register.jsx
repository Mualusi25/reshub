import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { MailCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import Field from '../components/Field'
import ResendVerification from '../components/ResendVerification'
import api, { errMsg } from '../api'

export default function Register() {
  const [sent, setSent] = useState(null) // { email, status } once the account exists
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { role: 'student' },
  })

  const onSubmit = async (values) => {
    try {
      const { data } = await api.post('/auth/register', {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: values.role,
      })
      setSent({ email: data.email, status: data.emailStatus })
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  if (sent) {
    return (
      <div className="auth">
        <div className="auth-card verify-card">
          <MailCheck size={44} strokeWidth={1.6} />
          <h1>Check your email</h1>
          {sent.status === 'failed' ? (
            <p>
              Your account was created, but we could not send the verification email just now.
              Tap the button below to try again.
            </p>
          ) : (
            <p>
              We have sent a verification link to <strong>{sent.email}</strong>. Open it to
              activate your account. The link works for 24 hours.
            </p>
          )}
          <p className="hint">Cannot see it? Check your spam folder.</p>
          <ResendVerification email={sent.email} startCooldown={sent.status !== 'failed'} />
          <p className="alt-text">
            Already verified? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h1>Create Your Account</h1>

        <Field label="Full name" id="fullName" error={errors.fullName}>
          <input id="fullName" {...register('fullName', { required: 'Full name is required' })} />
        </Field>

        <Field label="Email" id="email" error={errors.email}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
            })}
          />
        </Field>

        <Field label="I am a" id="role">
          <select id="role" {...register('role')}>
            <option value="student">Student</option>
            <option value="provider">Accommodation provider</option>
          </select>
        </Field>

        <Field label="Password" id="password" error={errors.password}>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'At least 8 characters' },
            })}
          />
        </Field>

        <Field label="Confirm password" id="confirm" error={errors.confirm}>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            {...register('confirm', {
              required: 'Please confirm your password',
              validate: (v) => v === getValues('password') || 'Passwords do not match',
            })}
          />
        </Field>

        <button className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Register'}
        </button>

        <p className="alt-text">
          Already registered? <Link to="/login">Student login</Link>
        </p>
      </form>
    </div>
  )
}