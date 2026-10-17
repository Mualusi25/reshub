import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Field from '../components/Field'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../api'

const TITLES = {
  student: 'Student Login',
  provider: 'Provider Login',
  agent: 'Agent Login',
  admin: 'Administrator Login',
}

const HOME = { provider: '/provider', agent: '/agent', admin: '/admin' }

export default function Login({ role = 'student' }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (values) => {
    try {
      const user = await login({ ...values, role })
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`)
      navigate(location.state?.from || HOME[user.role] || '/', { replace: true })
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h1>{TITLES[role]}</h1>

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

        <Field label="Password" id="password" error={errors.password}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password', { required: 'Password is required' })}
          />
        </Field>

        <button className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>

        {(role === 'student' || role === 'provider') && (
          <p className="alt-text">
            No account? <Link to="/register">Register</Link>
          </p>
        )}
      </form>
    </div>
  )
}
