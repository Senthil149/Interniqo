import axios from 'axios'
import { clearAuth, getAccessToken, getRefreshToken, persistAuth } from '../auth/tokenStorage.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshInFlight = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const isRefreshCall = original?.url?.includes('/api/auth/refresh')

    if (status !== 401 || original?._retry || isRefreshCall) {
      return Promise.reject(error)
    }

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      clearAuth()
      return Promise.reject(error)
    }

    original._retry = true
    try {
      if (!refreshInFlight) {
        refreshInFlight = api
          .post('/api/auth/refresh', { refreshToken })
          .then((res) => {
            persistAuth(res.data)
            return res.data.accessToken
          })
          .finally(() => {
            refreshInFlight = null
          })
      }
      const accessToken = await refreshInFlight
      original.headers.Authorization = `Bearer ${accessToken}`
      return api(original)
    } catch (refreshError) {
      clearAuth()
      return Promise.reject(refreshError)
    }
  },
)

export default api
