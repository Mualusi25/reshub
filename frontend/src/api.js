
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('reshub_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export const errMsg = (
  err,
  fallback = 'Something went wrong. Please try again.'
) => err?.response?.data?.error || fallback

export default api
