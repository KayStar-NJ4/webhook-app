// Utility to clear all authentication data and force fresh login
export const clearAllAuth = () => {
  
  // Clear localStorage
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  
  // Clear sessionStorage
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  
  // Clear any cookies (if any)
  document.cookie.split(";").forEach((c) => {
    const eqPos = c.indexOf("=")
    const name = eqPos > -1 ? c.substr(0, eqPos) : c
    if (name.includes('token') || name.includes('auth')) {
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
    }
  })
  
  // Reset redirect flag
  window.isRedirecting = false
  
  
  // Redirect to login
  window.location.href = '/admin/login'
}

// Auto-clear if token is invalid (run this in console if needed)
if (typeof window !== 'undefined') {
  window.clearAuth = clearAllAuth
}
