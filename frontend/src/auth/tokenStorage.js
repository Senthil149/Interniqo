const ACCESS_KEY = 'interniqo.accessToken'
const REFRESH_KEY = 'interniqo.refreshToken'
const USER_KEY = 'interniqo.user'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function persistAuth(payload) {
  if (payload.accessToken) {
    localStorage.setItem(ACCESS_KEY, payload.accessToken)
  }
  if (payload.refreshToken) {
    localStorage.setItem(REFRESH_KEY, payload.refreshToken)
  }
  if (payload.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
  }
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}
