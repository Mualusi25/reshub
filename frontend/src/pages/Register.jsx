import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Field from '../components/Field'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../api'

export default function Register() {
  const { register: signUp } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { role: 'student' },
  })

  const onSubmit = async (values) => {
    try {
      const user = await signUp({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: values.role,
      })
      toast.success('Account created. Welcome to ResHub!')
      navigate(user.role === 'provider' ? '/provider' : '/', { replace: true })
    } catch (err) {
      toast.error(errMsg(err))
    }
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
